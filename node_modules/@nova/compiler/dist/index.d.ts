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
 * Proper AST-based transformation for Nova JSX
 */
export declare function transformOptimizedJSX(sourceFile: ts.SourceFile, originalCode: string): HoistResult;
/**
 * Generate the final module code.
 */
export declare function generateDOMOps(optimized: HoistResult, originalCode: string): string;
/**
 * Preprocesses JSX/TSX curly brace expressions to compile Angular-style pipes:
 * `{ expression | pipe:arg1:arg2 }` compiles to `{ () => expression.pipe(pipe(arg1, arg2)) }`
 */
export declare function preprocessPipes(code: string, customPipes?: string[]): string;
/**
 * Full compilation pipeline:
 */
export declare function compile(code: string, options: CompilerOptions): Promise<CompileResult>;
//# sourceMappingURL=index.d.ts.map