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
    location: {
        start: number;
        end: number;
    };
    props: string[];
}
/**
 * Parse TSX/JSX into a lightweight AST.
 * Production: replace with @babel/parser or esbuild's built-in parser.
 */
export declare function parseTSX(code: string, filename: string): any;
/**
 * Detect all signal/computed/effect declarations in source code.
 */
export declare function detectSignals(ast: any): Set<string>;
/**
 * Detect PascalCase component usages — candidates for island splitting.
 */
export declare function detectIslands(ast: any, code: string): IslandInfo[];
/** Result of the hoisting transform */
export interface HoistResult {
    /** Transformed source with cloneNode() calls */
    code: string;
    /** Module-level declarations to prepend */
    hoisted: string[];
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
export declare function hoistStaticNodes(code: string): HoistResult;
/**
 * Optimize static nodes — integrates hoisting into the AST pipeline.
 * Returns the modified AST with hoisted declarations attached.
 */
export declare function optimizeStaticNodes(ast: any): any;
/**
 * Generate the final module code from the (possibly hoisted) AST.
 *
 * Prepends:
 *  - Nova imports
 *  - Hoisted static template declarations (module-level, created once)
 */
export declare function generateDOMOps(ast: any, originalCode: string): string;
/**
 * Full compilation pipeline:
 *  1. Parse source
 *  2. Detect signals and islands
 *  3. Hoist static JSX nodes
 *  4. Generate optimized module code
 */
export declare function compile(code: string, options: CompilerOptions): Promise<CompileResult>;
//# sourceMappingURL=index.d.ts.map