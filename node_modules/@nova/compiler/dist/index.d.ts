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
    location: {
        start: number;
        end: number;
    };
    props: string[];
}
/**
 * Parse TSX/JSX into a TypeScript AST.
 */
export declare function parseTSX(code: string, filename: string): ts.SourceFile;
/**
 * Detect all signal/computed declarations in source code using AST.
 */
export declare function detectSignals(sourceFile: ts.SourceFile): Set<string>;
/**
 * Detect PascalCase component usages — candidates for island splitting using AST.
 */
export declare function detectIslands(sourceFile: ts.SourceFile): IslandInfo[];
/** Result of the hoisting transform */
export interface HoistResult {
    code: string;
    hoisted: string[];
}
/**
 * Hoist static JSX nodes or transform dynamic ones to direct DOM operations.
 */
export declare function transformOptimizedJSX(sourceFile: ts.SourceFile, code: string): HoistResult;
/**
 * Generate the final module code.
 */
export declare function generateDOMOps(optimized: HoistResult, originalCode: string): string;
/**
 * Full compilation pipeline:
 *  1. Parse source
 *  2. Detect signals and islands
 *  3. Transform/Hoist JSX nodes
 *  4. Generate optimized module code
 */
export declare function compile(code: string, options: CompilerOptions): Promise<CompileResult>;
//# sourceMappingURL=index.d.ts.map