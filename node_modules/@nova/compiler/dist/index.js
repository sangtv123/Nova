import ts from 'typescript';
// ─── Parser ────────────────────────────────────────────────────────────────────
/**
 * Parse TSX/JSX into a TypeScript AST.
 */
export function parseTSX(code, filename) {
    return ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
// ─── Signal detection ──────────────────────────────────────────────────────────
/**
 * Detect all signal/computed declarations in source code using AST.
 */
export function detectSignals(sourceFile) {
    const signals = new Set();
    function visit(node) {
        if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
            const call = node.initializer;
            const expression = call.expression;
            let name = '';
            if (ts.isIdentifier(expression)) {
                name = expression.text;
            }
            else if (ts.isPropertyAccessExpression(expression)) {
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
export function detectIslands(sourceFile) {
    const islands = [];
    let islandCount = 0;
    function visit(node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const tagName = node.tagName.getText(sourceFile);
            if (/^[A-Z]/.test(tagName)) {
                const props = [];
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
/**
 * Check whether a JSX node is purely static (no expressions, no
 * uppercase component references, no event handlers).
 */
function isStaticNode(node, sourceFile) {
    if (ts.isJsxElement(node)) {
        const tagName = node.openingElement.tagName.getText(sourceFile);
        if (/^[A-Z]/.test(tagName))
            return false;
        // Check attributes
        for (const attr of node.openingElement.attributes.properties) {
            if (ts.isJsxAttribute(attr)) {
                const name = attr.name.getText(sourceFile);
                if (name.startsWith('on'))
                    return false;
                if (name === 'n-if' || name === 'n-for' || name === 'n-router')
                    return false;
                if (attr.initializer && !ts.isStringLiteral(attr.initializer))
                    return false;
            }
            else {
                return false; // Spread attribute
            }
        }
        // Check children
        for (const child of node.children) {
            if (ts.isJsxExpression(child))
                return false;
            if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                if (!isStaticNode(child, sourceFile))
                    return false;
            }
        }
        return true;
    }
    if (ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        if (/^[A-Z]/.test(tagName))
            return false;
        for (const attr of node.attributes.properties) {
            if (ts.isJsxAttribute(attr)) {
                if (attr.name.getText(sourceFile).startsWith('on'))
                    return false;
                if (attr.initializer && !ts.isStringLiteral(attr.initializer))
                    return false;
            }
            else {
                return false;
            }
        }
        return true;
    }
    if (ts.isJsxText(node))
        return true;
    return false;
}
/**
 * Proper AST-based transformation for Nova JSX
 */
export function transformOptimizedJSX(sourceFile, originalCode) {
    const hoisted = [];
    let counter = 0;
    const transformer = (context) => {
        const { factory } = context;
        return (rootNode) => {
            const visitor = (node, inJsxContext = false) => {
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    const opening = ts.isJsxElement(node) ? node.openingElement : node;
                    const tagName = opening.tagName.getText(sourceFile);
                    const attributes = opening.attributes.properties;
                    // 1. Handle Directives (n-if, n-for, n-router)
                    const nIfAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-if');
                    const nForAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-for');
                    const nRouterAttr = attributes.find(a => ts.isJsxAttribute(a) && a.name.getText(sourceFile) === 'n-router');
                    if (nIfAttr || nForAttr) {
                        // Remove the directives from attributes
                        const filteredAttrs = attributes.filter(a => a !== nIfAttr && a !== nForAttr);
                        const newOpening = ts.isJsxElement(node)
                            ? factory.updateJsxOpeningElement(node.openingElement, node.openingElement.tagName, node.openingElement.typeArguments, factory.createJsxAttributes(filteredAttrs))
                            : factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, factory.createJsxAttributes(filteredAttrs));
                        // Visit children of the transformed element (always in JSX context)
                        let transformedNode = ts.isJsxElement(node)
                            ? factory.updateJsxElement(node, newOpening, ts.visitNodes(node.children, (child) => visitor(child, true)), node.closingElement)
                            : newOpening;
                        if (nIfAttr) {
                            const condition = nIfAttr.initializer && ts.isJsxExpression(nIfAttr.initializer) ? nIfAttr.initializer.expression : null;
                            if (condition) {
                                transformedNode = factory.createConditionalExpression(factory.createPropertyAccessExpression(condition, 'value'), factory.createToken(ts.SyntaxKind.QuestionToken), transformedNode, factory.createToken(ts.SyntaxKind.ColonToken), factory.createNull());
                            }
                        }
                        if (nForAttr) {
                            const val = nForAttr.initializer && ts.isStringLiteral(nForAttr.initializer) ? nForAttr.initializer.text : null;
                            if (val && val.includes(' in ')) {
                                const [item, items] = val.split(' in ');
                                transformedNode = factory.createCallExpression(factory.createPropertyAccessExpression(factory.createPropertyAccessExpression(factory.createIdentifier(items), 'value'), 'map'), undefined, [
                                    factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, item)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), transformedNode)
                                ]);
                            }
                        }
                        // Wrap in arrow function for reactivity
                        transformedNode = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), transformedNode);
                        // CRITICAL: Only wrap in JsxExpression if it's a child of another JSX element
                        if (inJsxContext) {
                            return factory.createJsxExpression(undefined, transformedNode);
                        }
                        return factory.createParenthesizedExpression(transformedNode);
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
                                filteredAttrs.push(factory.createJsxAttribute(factory.createIdentifier('href'), typeof routeValue === 'string' ? factory.createStringLiteral(routeValue) : factory.createJsxExpression(undefined, routeValue)));
                            }
                            // Add onClick handler: (e) => { e.preventDefault(); router.navigate(routeValue) }
                            const onClickHandler = factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, 'e')], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createBlock([
                                factory.createExpressionStatement(factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('e'), 'preventDefault'), undefined, [])),
                                factory.createExpressionStatement(factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('router'), 'navigate'), undefined, [typeof routeValue === 'string' ? factory.createStringLiteral(routeValue) : routeValue]))
                            ]));
                            filteredAttrs.push(factory.createJsxAttribute(factory.createIdentifier('onClick'), factory.createJsxExpression(undefined, onClickHandler)));
                            const newOpening = ts.isJsxElement(node)
                                ? factory.updateJsxOpeningElement(node.openingElement, node.openingElement.tagName, node.openingElement.typeArguments, factory.createJsxAttributes(filteredAttrs))
                                : factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, factory.createJsxAttributes(filteredAttrs));
                            // Visit children of the transformed element (always in JSX context)
                            return ts.isJsxElement(node)
                                ? factory.updateJsxElement(node, newOpening, ts.visitNodes(node.children, (child) => visitor(child, true)), node.closingElement)
                                : newOpening;
                        }
                    }
                    // 2. Handle Hoisting for static native elements
                    if (/^[a-z]/.test(tagName) && isStaticNode(node, sourceFile)) {
                        const printer = ts.createPrinter();
                        const jsxStr = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
                        const varName = `_s${counter++}`;
                        hoisted.push(`const ${varName} = /*@__PURE__*/ createTemplate(\`${jsxStr.replace(/`/g, '\\`')}\`);`);
                        const call = factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier(varName), 'cloneNode'), undefined, [factory.createTrue()]);
                        if (inJsxContext) {
                            return factory.createJsxExpression(undefined, call);
                        }
                        return factory.createParenthesizedExpression(call);
                    }
                }
                const isJsxParent = ts.isJsxElement(node) || ts.isJsxFragment(node);
                return ts.visitEachChild(node, (child) => visitor(child, isJsxParent), context);
            };
            return ts.visitNode(rootNode, (node) => visitor(node, false));
        };
    };
    const result = ts.transform(sourceFile, [transformer]);
    let transformedSourceFile = result.transformed[0];
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
            const newImport = ts.factory.createImportDeclaration(undefined, ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
                ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('createTemplate'))
            ])), ts.factory.createStringLiteral('@nova/runtime'));
            newStatements.unshift(newImport);
        }
    }
    if (needsRouter) {
        const hasRouter = originalCode.match(/import\s+.*router/);
        if (!hasRouter) {
            const newImport = ts.factory.createImportDeclaration(undefined, ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
                ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('router'))
            ])), ts.factory.createStringLiteral('@nova/router'));
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
export function generateDOMOps(optimized, originalCode) {
    const source = optimized.code ?? originalCode;
    const hoisted = optimized.hoisted ?? [];
    const lines = [];
    if (hoisted.length > 0) {
        lines.push('// ── Hoisted static templates ──');
        lines.push(...hoisted);
        lines.push('');
    }
    lines.push(source);
    return lines.join('\n');
}
/**
 * Full compilation pipeline:
 */
export async function compile(code, options) {
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
//# sourceMappingURL=index.js.map