import ts from 'typescript';

/**
 * Compiler options
 */
export interface CompilerOptions {
  filename: string;
  isSSR?: boolean;
  isDev?: boolean;
  customPipes?: string[];
}

export interface CompileResult {
  code: string;
  map?: string;
  ast?: ts.SourceFile;
  signals: Set<string>;
  islands: IslandInfo[];
  /** Static nodes that were hoisted to module scope */
  hoistedCount: number;
}

export interface IslandInfo {
  id: string;
  name: string;
  location: { start: number; end: number };
  props: string[];
}

// ─── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse TSX/JSX into a TypeScript AST.
 */
export function parseTSX(code: string, filename: string): ts.SourceFile {
  return ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
}

// ─── Signal detection ──────────────────────────────────────────────────────────

/**
 * Detect all signal/computed declarations in source code using AST.
 */
export function detectSignals(sourceFile: ts.SourceFile): Set<string> {
  const signals = new Set<string>();
  
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
      const call = node.initializer;
      const expression = call.expression;
      
      let name = '';
      if (ts.isIdentifier(expression)) {
        name = expression.text;
      } else if (ts.isPropertyAccessExpression(expression)) {
        name = expression.name.text;
      }

      if (name === 'signal' || name === 'computed') {
        if (ts.isIdentifier(node.name)) {
          signals.add(node.name.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return signals;
}

// ─── Island detection ──────────────────────────────────────────────────────────

/**
 * Detect PascalCase component usages — candidates for island splitting using AST.
 */
export function detectIslands(sourceFile: ts.SourceFile): IslandInfo[] {
  const islands: IslandInfo[] = [];
  let islandCount = 0;

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      if (/^[A-Z]/.test(tagName)) {
        const props: string[] = [];
        const attributes = node.attributes;
        
        attributes.properties.forEach(prop => {
          if (ts.isJsxAttribute(prop)) {
            props.push(prop.name.getText(sourceFile));
          }
        });

        islands.push({
          id: `island_${islandCount++}`,
          name: tagName,
          location: { start: node.getStart(sourceFile), end: node.getEnd() },
          props,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return islands;
}

// ─── Static node hoisting ──────────────────────────────────────────────────────

/** Result of the hoisting transform */
export interface HoistResult {
  code: string;
  hoisted: string[];
}

/**
 * Check whether a JSX node is purely static (no expressions, no
 * uppercase component references, no event handlers).
 */
function isStaticNode(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  if (ts.isJsxElement(node)) {
    const tagName = node.openingElement.tagName.getText(sourceFile);
    if (/^[A-Z]/.test(tagName)) return false;
    
    // Check attributes
    for (const attr of node.openingElement.attributes.properties) {
      if (ts.isJsxAttribute(attr)) {
        const name = attr.name.getText(sourceFile);
        if (name.startsWith('on')) return false;
        if (name === 'n-if' || name === 'n-for' || name === 'n-router') return false;
        if (attr.initializer && !ts.isStringLiteral(attr.initializer)) return false;
      } else {
        return false; // Spread attribute
      }
    }
    
    // Check children
    for (const child of node.children) {
      if (ts.isJsxExpression(child)) return false;
      if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
        if (!isStaticNode(child, sourceFile)) return false;
      }
    }
    return true;
  }
  
  if (ts.isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText(sourceFile);
    if (/^[A-Z]/.test(tagName)) return false;
    
    for (const attr of node.attributes.properties) {
      if (ts.isJsxAttribute(attr)) {
        if (attr.name.getText(sourceFile).startsWith('on')) return false;
        if (attr.initializer && !ts.isStringLiteral(attr.initializer)) return false;
      } else {
        return false;
      }
    }
    return true;
  }
  
  if (ts.isJsxText(node)) return true;
  
  return false;
}

/**
 * Proper AST-based transformation for Nova JSX
 */
export function transformOptimizedJSX(sourceFile: ts.SourceFile, originalCode: string): HoistResult {
  const hoisted: string[] = [];
  let counter = 0;

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const { factory } = context;

    return (rootNode) => {
      const visitor = (node: ts.Node, inJsxContext: boolean = false): ts.Node => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          const opening = ts.isJsxElement(node) ? node.openingElement : node;
          const tagName = opening.tagName.getText(sourceFile);
          const attributes = opening.attributes.properties;

          // 1. Handle Directives (n-if, n-for, n-router)
          const nIfAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-if') as ts.JsxAttribute;
          const nForAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-for') as ts.JsxAttribute;
          const nRouterAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-router') as ts.JsxAttribute;

          if (nIfAttr || nForAttr) {
            // Remove the directives from attributes
            const filteredAttrs = attributes.filter(a => a !== nIfAttr && a !== nForAttr);
            const newOpening = ts.isJsxElement(node)
              ? factory.updateJsxOpeningElement(node.openingElement, node.openingElement.tagName, node.openingElement.typeArguments, factory.createJsxAttributes(filteredAttrs as any))
              : factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, factory.createJsxAttributes(filteredAttrs as any));
            
            // Visit children of the transformed element (always in JSX context)
            let transformedNode: ts.Node = ts.isJsxElement(node)
              ? factory.updateJsxElement(node, newOpening as ts.JsxOpeningElement, ts.visitNodes(node.children, (child) => visitor(child, true)) as any, node.closingElement)
              : newOpening;

            if (nIfAttr) {
              const condition = nIfAttr.initializer && ts.isJsxExpression(nIfAttr.initializer) ? nIfAttr.initializer.expression : null;
              if (condition) {
                transformedNode = factory.createConditionalExpression(
                  factory.createPropertyAccessExpression(condition as ts.Expression, 'value'),
                  factory.createToken(ts.SyntaxKind.QuestionToken),
                  transformedNode as ts.Expression,
                  factory.createToken(ts.SyntaxKind.ColonToken),
                  factory.createNull()
                );
              }
            }

            if (nForAttr) {
              const val = nForAttr.initializer && ts.isStringLiteral(nForAttr.initializer) ? nForAttr.initializer.text : null;
              if (val && val.includes(' in ')) {
                const [item, items] = val.split(' in ');
                transformedNode = factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier(items), 'value'),
                    'map'
                  ),
                  undefined,
                  [
                    factory.createArrowFunction(
                      undefined,
                      undefined,
                      [factory.createParameterDeclaration(undefined, undefined, item)],
                      undefined,
                      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                      transformedNode as ts.Expression
                    )
                  ]
                );
              }
            }

            // Wrap in arrow function for reactivity
            transformedNode = factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              transformedNode as ts.Expression
            );

            // CRITICAL: Only wrap in JsxExpression if it's a child of another JSX element
            if (inJsxContext) {
              return factory.createJsxExpression(undefined, transformedNode as ts.Expression);
            }
            return factory.createParenthesizedExpression(transformedNode as ts.Expression);
          }

          // 1b. Handle n-router (Navigation Directive)
          if (nRouterAttr) {
            const routeValue = nRouterAttr.initializer && ts.isStringLiteral(nRouterAttr.initializer) 
              ? nRouterAttr.initializer.text 
              : (nRouterAttr.initializer && ts.isJsxExpression(nRouterAttr.initializer) ? nRouterAttr.initializer.expression : null);

            if (routeValue) {
              const filteredAttrs = attributes.filter(a => a !== nRouterAttr);
              
              // Add href if missing
              if (!filteredAttrs.some(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'href')) {
                filteredAttrs.push(factory.createJsxAttribute(
                  factory.createIdentifier('href'),
                  typeof routeValue === 'string' ? factory.createStringLiteral(routeValue) : factory.createJsxExpression(undefined, routeValue as ts.Expression)
                ));
              }

              // Add onClick handler: (e) => { e.preventDefault(); router.navigate(routeValue) }
              const onClickHandler = factory.createArrowFunction(
                undefined,
                undefined,
                [factory.createParameterDeclaration(undefined, undefined, 'e')],
                undefined,
                factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                factory.createBlock([
                  factory.createExpressionStatement(factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('e'), 'preventDefault'),
                    undefined,
                    []
                  )),
                  factory.createExpressionStatement(factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('router'), 'navigate'),
                    undefined,
                    [typeof routeValue === 'string' ? factory.createStringLiteral(routeValue) : routeValue as ts.Expression]
                  ))
                ])
              );

              filteredAttrs.push(factory.createJsxAttribute(
                factory.createIdentifier('onClick'),
                factory.createJsxExpression(undefined, onClickHandler)
              ));

              const newOpening = ts.isJsxElement(node)
                ? factory.updateJsxOpeningElement(node.openingElement, node.openingElement.tagName, node.openingElement.typeArguments, factory.createJsxAttributes(filteredAttrs as any))
                : factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, factory.createJsxAttributes(filteredAttrs as any));

              // Visit children of the transformed element (always in JSX context)
              return ts.isJsxElement(node)
                ? factory.updateJsxElement(node, newOpening as ts.JsxOpeningElement, ts.visitNodes(node.children, (child) => visitor(child, true)) as any, node.closingElement)
                : newOpening;
            }
          }

          // 2. Handle Hoisting for static native elements
          if (/^[a-z]/.test(tagName) && isStaticNode(node, sourceFile)) {
            const printer = ts.createPrinter();
            const jsxStr = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
            const varName = `_s${counter++}`;
            hoisted.push(`const ${varName} = /*@__PURE__*/ createTemplate(\`${jsxStr.replace(/`/g, '\\`')}\`);`);
            
            const call = factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier(varName), 'cloneNode'),
              undefined,
              [factory.createTrue()]
            );

            if (inJsxContext) {
              return factory.createJsxExpression(undefined, call);
            }
            return factory.createParenthesizedExpression(call);
          }
        }

        const isJsxParent = ts.isJsxElement(node) || ts.isJsxFragment(node);
        return ts.visitEachChild(node, (child) => visitor(child, isJsxParent), context);
      };

      return ts.visitNode(rootNode, (node) => visitor(node, false)) as ts.SourceFile;
    };
  };

  const result = ts.transform(sourceFile, [transformer]);
  let transformedSourceFile = result.transformed[0] as ts.SourceFile;

  // 3. Add necessary imports
  const printer = ts.createPrinter();
  const existingStatements = transformedSourceFile.statements;
  const existingImports = existingStatements.filter(ts.isImportDeclaration);
  
  const needsRuntime = hoisted.length > 0;
  const needsRouter = originalCode.includes('n-router'); // Simple check for now
  
  let newStatements = [...existingStatements];

  if (needsRuntime) {
    const hasCreateTemplate = originalCode.match(/import\s+.*createTemplate/);
    if (!hasCreateTemplate) {
      const newImport = ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('createTemplate'))
        ])),
        ts.factory.createStringLiteral('@nova/runtime')
      );
      newStatements.unshift(newImport);
    }
  }

  if (needsRouter) {
    const hasRouter = originalCode.match(/import\s+.*router/);
    if (!hasRouter) {
      const newImport = ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('router'))
        ])),
        ts.factory.createStringLiteral('@nova/router')
      );
      newStatements.unshift(newImport);
    }
  }

  transformedSourceFile = ts.factory.updateSourceFile(transformedSourceFile, newStatements);

  const transformedCode = printer.printFile(transformedSourceFile);

  return { code: transformedCode, hoisted };
}

// ─── Code generation ───────────────────────────────────────────────────────────

/**
 * Generate the final module code.
 */
export function generateDOMOps(optimized: HoistResult, originalCode: string): string {
  const source: string = optimized.code ?? originalCode;
  const hoisted: string[] = optimized.hoisted ?? [];

  const lines: string[] = [];

  if (hoisted.length > 0) {
    lines.push('// ── Hoisted static templates ──');
    lines.push(...hoisted);
    lines.push('');
  }

  lines.push(source);

  return lines.join('\n');
}

/**
 * Preprocesses JSX/TSX curly brace expressions to compile Angular-style pipes:
 * `{ expression | pipe:arg1:arg2 }` compiles to `{ () => expression.pipe(pipe(arg1, arg2)) }`
 */
export function preprocessPipes(code: string, customPipes: string[] = []): string {
  const KNOWN_PIPES = [
    'uppercase', 'lowercase', 'titlecase', 'keyvalue', 'async', 'asyncPipe', 
    'currency', 'date', 'json', 'defaultVal', 'decimal', 'percent', 'slice',
    'reverse', 'truncate',
    ...customPipes
  ];

  return code.replace(/\{([^}]+)\}/g, (match, expression) => {
    // Avoid double braces like style={{ ... }}
    if (expression.startsWith('{') && expression.endsWith('}')) return match;
    if (!expression.includes('|')) return match;

    const parts = expression.split('|').map((s: string) => s.trim());
    if (parts.length < 2) return match;

    // Check if all RHS parts are actually known pipes to prevent bitwise OR confusion
    let hasPipes = true;
    for (let i = 1; i < parts.length; i++) {
      const pipePart = parts[i];
      const colonIndex = pipePart.indexOf(':');
      const pipeName = colonIndex === -1 ? pipePart : pipePart.substring(0, colonIndex).trim();
      if (!KNOWN_PIPES.includes(pipeName)) {
        hasPipes = false;
        break;
      }
    }

    if (!hasPipes) return match;

    const BUILTIN_PIPES = [
      'uppercase', 'lowercase', 'titlecase', 'keyvalue', 'async', 'asyncPipe', 
      'currency', 'date', 'json', 'defaultVal', 'decimal', 'percent', 'slice',
      'reverse', 'truncate'
    ];

    let result = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const pipePart = parts[i];
      const colonIndex = pipePart.indexOf(':');
      
      if (colonIndex === -1) {
        const pipeName = pipePart;
        const isBuiltin = BUILTIN_PIPES.includes(pipeName);
        
        if (isBuiltin) {
          const directPipes = ['uppercase', 'lowercase', 'titlecase', 'keyvalue', 'async', 'asyncPipe', 'reverse'];
          if (directPipes.includes(pipeName)) {
            result = `${result}.pipe(${pipeName})`;
          } else {
            result = `${result}.pipe(${pipeName}())`;
          }
        } else {
          result = `${result}.pipe(resolvePipe('${pipeName}')())`;
        }
      } else {
        const pipeName = pipePart.substring(0, colonIndex).trim();
        const argsStr = pipePart.substring(colonIndex + 1);
        
        const args: string[] = [];
        let currentArg = '';
        let inString = false;
        let stringChar = '';

        for (let j = 0; j < argsStr.length; j++) {
          const char = argsStr[j];
          if ((char === "'" || char === '"' || char === '`') && argsStr[j - 1] !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
            }
            currentArg += char;
          } else if (char === ':' && !inString) {
            args.push(currentArg.trim());
            currentArg = '';
          } else {
            currentArg += char;
          }
        }
        if (currentArg.trim()) {
          args.push(currentArg.trim());
        }

        const formattedArgs = args.join(', ');
        const isBuiltin = BUILTIN_PIPES.includes(pipeName);
        
        if (isBuiltin) {
          result = `${result}.pipe(${pipeName}(${formattedArgs}))`;
        } else {
          result = `${result}.pipe(resolvePipe('${pipeName}')(${formattedArgs}))`;
        }
      }
    }

    return `{() => ${result}.value}`;
  });
}

/**
 * Full compilation pipeline:
 */
export async function compile(
  code: string,
  options: CompilerOptions
): Promise<CompileResult> {
  const preprocessedCode = preprocessPipes(code, options.customPipes);
  const sourceFile = parseTSX(preprocessedCode, options.filename);
  const signals = detectSignals(sourceFile);
  const islands = detectIslands(sourceFile);

  const optimized = transformOptimizedJSX(sourceFile, preprocessedCode);
  const generatedCode = generateDOMOps(optimized, preprocessedCode);
  const hoistedCount = (optimized.hoisted).length;

  if (options.isDev && hoistedCount > 0) {
    console.log(`[nova/compiler] ${options.filename}: optimized ${hoistedCount} node(s)`);
  }

  return {
    code: generatedCode,
    ast: sourceFile,
    signals,
    islands,
    hoistedCount,
  };
}
