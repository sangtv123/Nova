// ─── Parser ────────────────────────────────────────────────────────────────────
/**
 * Parse TSX/JSX into a lightweight AST.
 * Production: replace with @babel/parser or esbuild's built-in parser.
 */
export function parseTSX(code, filename) {
    const ast = {
        type: 'Program',
        body: [],
        filename,
    };
    try {
        ast.lines = code.split('\n');
        ast.source = code;
        return ast;
    }
    catch (error) {
        throw new Error(`Parse error in ${filename}: ${error}`);
    }
}
// ─── Signal detection ──────────────────────────────────────────────────────────
/**
 * Detect all signal/computed/effect declarations in source code.
 */
export function detectSignals(ast) {
    const signals = new Set();
    const signalPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:signal|computed)\s*\(/g;
    const code = ast.source ?? ast.lines?.join('\n') ?? '';
    let match;
    while ((match = signalPattern.exec(code)) !== null) {
        signals.add(match[1]);
    }
    return signals;
}
// ─── Island detection ──────────────────────────────────────────────────────────
/**
 * Detect PascalCase component usages — candidates for island splitting.
 */
export function detectIslands(ast, code) {
    const islands = [];
    let islandCount = 0;
    const componentPattern = /<([A-Z]\w*)[^>]*>/g;
    let match;
    while ((match = componentPattern.exec(code)) !== null) {
        const openTagMatch = code.slice(match.index, match.index + 200);
        const propPattern = /\s+(\w+)(?:\s*=\s*(?:"[^"]*"|{[^}]*}))?/g;
        const props = [];
        let propMatch;
        while ((propMatch = propPattern.exec(openTagMatch)) !== null) {
            props.push(propMatch[1]);
        }
        islands.push({
            id: `island_${islandCount++}`,
            name: match[1],
            location: { start: match.index, end: match.index + match[0].length },
            props,
        });
    }
    return islands;
}
/**
 * Check whether a JSX element string is purely static (no expressions, no
 * uppercase component references, no event handlers).
 */
function isStaticElement(jsxStr) {
    // Reject if there is any interpolation or event handler
    if (jsxStr.includes('{') || jsxStr.includes('on'))
        return false;
    // Reject if it contains a PascalCase child component
    if (/<[A-Z]/.test(jsxStr))
        return false;
    return true;
}
/**
 * Hoist static JSX nodes to module-level `createTemplate()` calls.
 *
 * Transforms:
 * ```tsx
 * // Before
 * <span class="badge">New</span>
 *
 * // After (module-level)
 * const _s0 = createTemplate(`<span class="badge">New</span>`);
 *
 * // After (inline)
 * _s0.cloneNode(true)
 * ```
 */
export function hoistStaticNodes(code) {
    const hoisted = [];
    let counter = 0;
    // Match paired tags: <tag attrs>...content...</tag>  (single-line, non-greedy)
    // Excludes tags containing { } (dynamic) and uppercase component names
    const pairedTag = /<([a-z][a-zA-Z0-9]*)([^>]*)>([^<{]*)<\/\1>/g;
    // Match self-closing tags: <tag attrs />
    const selfClosingTag = /<([a-z][a-zA-Z0-9]*)([^>]*?)\/>/g;
    let transformed = code;
    // Process paired tags first
    transformed = transformed.replace(pairedTag, (match) => {
        if (!isStaticElement(match))
            return match;
        const escaped = match.replace(/`/g, '\\`');
        const varName = `_s${counter++}`;
        hoisted.push(`const ${varName} = /*@__PURE__*/ createTemplate(\`${escaped}\`);`);
        // Wrap in fragment to ensure esbuild treats it as an expression, not text
        return `<>{${varName}.cloneNode(true)}</>`;
    });
    // Process self-closing tags
    transformed = transformed.replace(selfClosingTag, (match) => {
        if (!isStaticElement(match))
            return match;
        const escaped = match.replace(/`/g, '\\`');
        const varName = `_s${counter++}`;
        hoisted.push(`const ${varName} = /*@__PURE__*/ createTemplate(\`${escaped}\`);`);
        return `<>{${varName}.cloneNode(true)}</>`;
    });
    return { code: transformed, hoisted };
}
/**
 * Optimize static nodes — integrates hoisting into the AST pipeline.
 * Returns the modified AST with hoisted declarations attached.
 */
export function optimizeStaticNodes(ast) {
    if (!ast.source)
        return ast;
    const { code: transformedSource, hoisted } = hoistStaticNodes(ast.source);
    return {
        ...ast,
        source: transformedSource,
        hoistedDeclarations: hoisted,
    };
}
// ─── Code generation ───────────────────────────────────────────────────────────
/**
 * Generate the final module code from the (possibly hoisted) AST.
 *
 * Prepends:
 *  - Nova imports
 *  - Hoisted static template declarations (module-level, created once)
 */
export function generateDOMOps(ast, originalCode) {
    const source = ast.source ?? originalCode;
    const hoisted = ast.hoistedDeclarations ?? [];
    const lines = [];
    // Framework imports — tree-shaken by esbuild if unused
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
// ─── Main pipeline ─────────────────────────────────────────────────────────────
/**
 * Full compilation pipeline:
 *  1. Parse source
 *  2. Detect signals and islands
 *  3. Hoist static JSX nodes
 *  4. Generate optimized module code
 */
export async function compile(code, options) {
    const ast = parseTSX(code, options.filename);
    const signals = detectSignals(ast);
    const islands = detectIslands(ast, code);
    const optimizedAst = optimizeStaticNodes(ast);
    const generatedCode = generateDOMOps(optimizedAst, code);
    const hoistedCount = (optimizedAst.hoistedDeclarations ?? []).length;
    if (options.isDev && hoistedCount > 0) {
        console.log(`[nova/compiler] ${options.filename}: hoisted ${hoistedCount} static node(s)`);
    }
    return {
        code: generatedCode,
        ast: optimizedAst,
        signals,
        islands,
        hoistedCount,
    };
}
//# sourceMappingURL=index.js.map