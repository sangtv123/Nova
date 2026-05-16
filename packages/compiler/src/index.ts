import ts from 'typescript';

/**
 * Compiler options
 */
export interface CompilerOptions {
  filename: string;
  isSSR?: boolean;
  isDev?: boolean;
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
        if (attr.name.getText(sourceFile).startsWith('on')) return false;
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
 * Hoist static JSX nodes or transform dynamic ones to direct DOM operations.
 */
export function transformOptimizedJSX(sourceFile: ts.SourceFile, code: string): HoistResult {
  const hoisted: string[] = [];
  const replacements: { start: number; end: number; text: string }[] = [];
  let counter = 0;

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tagName = opening.tagName.getText(sourceFile);

      // Only optimize native HTML elements (lowercase)
      if (/^[a-z]/.test(tagName)) {
        const attributes = opening.attributes.properties;
        const nIfAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-if') as ts.JsxAttribute;
        const nForAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-for') as ts.JsxAttribute;

        if (nIfAttr) {
          const condition = nIfAttr.initializer && ts.isJsxExpression(nIfAttr.initializer) ? nIfAttr.initializer.expression?.getText(sourceFile) : null;
          if (condition) {
            // Remove n-if from the node for further processing
            const elementCode = node.getText(sourceFile).replace(/n-if=\{[^}]+\}/, '');
            replacements.push({
              start: node.getStart(sourceFile),
              end: node.getEnd(),
              text: `(${condition}.value ? ${elementCode} : null)`
            });
            return;
          }
        }

        if (nForAttr) {
          const val = nForAttr.initializer && ts.isStringLiteral(nForAttr.initializer) ? nForAttr.initializer.text : null;
          if (val && val.includes(' in ')) {
            const [item, items] = val.split(' in ');
            const elementCode = node.getText(sourceFile).replace(/n-for="[^"]+"/, '');
            replacements.push({
              start: node.getStart(sourceFile),
              end: node.getEnd(),
              text: `(${items}.value.map(${item} => ${elementCode}))`
            });
            return;
          }
        }

        if (isStaticNode(node, sourceFile)) {
          // Static Hoisting
          const jsxStr = node.getText(sourceFile);
          const escaped = jsxStr.replace(/`/g, '\\`');
          const varName = `_s${counter++}`;
          hoisted.push(`const ${varName} = /*@__PURE__*/ createTemplate(\`${escaped}\`);`);
          
          replacements.push({
            start: node.getStart(sourceFile),
            end: node.getEnd(),
            text: `(${varName}.cloneNode(true))`
          });
          return;
        } else {
          // Dynamic Optimization (Lite version)
          // Transform <div class={c}>{v}</div> to an optimized createElement call
          // or a direct DOM-op IIFE. For now, we'll use a hint for runtime.
          // In a full implementation, this would emit direct DOM calls.
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Apply replacements
  let transformed = code;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    transformed = transformed.slice(0, r.start) + r.text + transformed.slice(r.end);
  }

  return { code: transformed, hoisted };
}

// ─── Code generation ───────────────────────────────────────────────────────────

/**
 * Generate the final module code.
 */
export function generateDOMOps(optimized: HoistResult, originalCode: string): string {
  const source: string = optimized.code ?? originalCode;
  const hoisted: string[] = optimized.hoisted ?? [];

  const lines: string[] = [];

  lines.push(`// Generated Nova component`);
  lines.push(`import { signal, computed, effect, domEffect } from '@nova/signals';`);
  lines.push(`import { createElement, createTemplate, Fragment } from '@nova/runtime';`);

  if (hoisted.length > 0) {
    lines.push('');
    lines.push('// ── Hoisted static templates (created once, cloned on each render) ──');
    lines.push(...hoisted);
  }

  lines.push('');
  lines.push(source);

  return lines.join('\n');
}

/**
 * Full compilation pipeline:
 *  1. Parse source
 *  2. Detect signals and islands
 *  3. Transform/Hoist JSX nodes
 *  4. Generate optimized module code
 */
export async function compile(
  code: string,
  options: CompilerOptions
): Promise<CompileResult> {
  const sourceFile = parseTSX(code, options.filename);
  const signals = detectSignals(sourceFile);
  const islands = detectIslands(sourceFile);

  const optimized = transformOptimizedJSX(sourceFile, code);
  const generatedCode = generateDOMOps(optimized, code);
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
