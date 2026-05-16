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
  ast?: any;
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
 * Parse TSX/JSX into a lightweight AST.
 * Production: replace with @babel/parser or esbuild's built-in parser.
 */
export function parseTSX(code: string, filename: string): any {
  const ast: any = {
    type: 'Program',
    body: [],
    filename,
  };
  try {
    ast.lines = code.split('\n');
    ast.source = code;
    return ast;
  } catch (error) {
    throw new Error(`Parse error in ${filename}: ${error}`);
  }
}

// ─── Signal detection ──────────────────────────────────────────────────────────

/**
 * Detect all signal/computed/effect declarations in source code.
 */
export function detectSignals(ast: any): Set<string> {
  const signals = new Set<string>();
  const signalPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:signal|computed)\s*\(/g;
  const code: string = ast.source ?? ast.lines?.join('\n') ?? '';
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
export function detectIslands(ast: any, code: string): IslandInfo[] {
  const islands: IslandInfo[] = [];
  let islandCount = 0;
  const componentPattern = /<([A-Z]\w*)[^>]*>/g;
  let match;
  while ((match = componentPattern.exec(code)) !== null) {
    const openTagMatch = code.slice(match.index, match.index + 200);
    const propPattern = /\s+(\w+)(?:\s*=\s*(?:"[^"]*"|{[^}]*}))?/g;
    const props: string[] = [];
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

// ─── Static node hoisting ──────────────────────────────────────────────────────
//
// Goal: JSX nodes that contain no dynamic expressions ({...}) are recreated on
// every component call. We can instead parse them once into a <template> element
// and clone it cheaply via cloneNode(true) on every render.
//
// Algorithm:
//  1. Find self-closing and paired JSX tags that are entirely lowercase (native HTML)
//  2. Skip any that contain a `{` (dynamic expression) or uppercase child component
//  3. Replace inline JSX with `_s<N>.cloneNode(true)` and hoist a
//     `const _s<N> = createTemplate(\`<html>\`)` declaration to module scope.
//
// Note: This is a source-level transform on the raw TSX string. A production
// implementation would operate on a proper AST (e.g. from @babel/parser).

/** Result of the hoisting transform */
export interface HoistResult {
  /** Transformed source with cloneNode() calls */
  code: string;
  /** Module-level declarations to prepend */
  hoisted: string[];
}

/**
 * Check whether a JSX element string is purely static (no expressions, no
 * uppercase component references, no event handlers).
 */
function isStaticElement(jsxStr: string): boolean {
  // Reject if there is any interpolation or event handler
  if (jsxStr.includes('{') || jsxStr.includes('on')) return false;
  // Reject if it contains a PascalCase child component
  if (/<[A-Z]/.test(jsxStr)) return false;
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
export function hoistStaticNodes(code: string): HoistResult {
  const hoisted: string[] = [];
  let counter = 0;

  // Match paired tags: <tag attrs>...content...</tag>  (single-line, non-greedy)
  // Excludes tags containing { } (dynamic) and uppercase component names
  const pairedTag = /<([a-z][a-zA-Z0-9]*)([^>]*)>([^<{]*)<\/\1>/g;

  // Match self-closing tags: <tag attrs />
  const selfClosingTag = /<([a-z][a-zA-Z0-9]*)([^>]*?)\/>/g;

  let transformed = code;

  // Process paired tags first
  transformed = transformed.replace(pairedTag, (match) => {
    if (!isStaticElement(match)) return match;
    const escaped = match.replace(/`/g, '\\`');
    const varName = `_s${counter++}`;
    hoisted.push(`const ${varName} = /*@__PURE__*/ createTemplate(\`${escaped}\`);`);
    // Wrap in fragment to ensure esbuild treats it as an expression, not text
    return `<>{${varName}.cloneNode(true)}</>`;
  });

  // Process self-closing tags
  transformed = transformed.replace(selfClosingTag, (match) => {
    if (!isStaticElement(match)) return match;
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
export function optimizeStaticNodes(ast: any): any {
  if (!ast.source) return ast;

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
export function generateDOMOps(ast: any, originalCode: string): string {
  const source: string = ast.source ?? originalCode;
  const hoisted: string[] = ast.hoistedDeclarations ?? [];

  const lines: string[] = [];

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
export async function compile(
  code: string,
  options: CompilerOptions
): Promise<CompileResult> {
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
