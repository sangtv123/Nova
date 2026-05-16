/**
 * Build options
 */
export interface BuildOptions {
    entry: string | Record<string, string>;
    outDir?: string;
    minify?: boolean;
    sourceMap?: boolean;
    ssr?: boolean;
    target?: string;
    /** Print bundle size analysis after build */
    analyze?: boolean;
    /** External packages — not bundled (saves size on shared host/CDN) */
    /** External packages — not bundled (saves size on shared host/CDN) */
    external?: string[];
    /** Custom esbuild plugins */
    plugins?: any[];
}
/**
 * Build result
 */
export interface BuildResult {
    code: string;
    map?: string;
    fileName: string;
    /** Raw esbuild metafile for further analysis */
    metafile?: any;
    modules: Record<string, string>;
}
/**
 * Island bundle info
 */
export interface IslandBundle {
    id: string;
    fileName: string;
    code: string;
    /** Compressed size estimate in bytes */
    size: number;
}
/**
 * esbuild-powered builder — actual tree-shaking, minification and code-splitting.
 */
export declare class Builder {
    private options;
    constructor(options: BuildOptions);
    /**
     * Build the main application bundle with esbuild.
     * Tree-shaking and code-splitting are enabled by default.
     */
    buildMain(): Promise<BuildResult>;
    /**
     * Build individual island bundles.
     * Each island is an independent ESM chunk with shared deps extracted automatically.
     */
    buildIslands(islands: Array<{
        id: string;
        entry: string;
    }>): Promise<IslandBundle[]>;
    /**
     * Minify an arbitrary code string with esbuild (fast, parallel).
     */
    minify(code: string): Promise<string>;
    /**
     * Build a Node.js-compatible SSR bundle.
     * Client-only APIs are replaced with SSR-safe stubs.
     */
    buildSSR(entry: string): Promise<BuildResult>;
    /**
     * Print a human-readable bundle size report.
     */
    printAnalysis(metafile: any): Promise<void>;
    /**
     * Write analysis to a JSON file for CI/CD use.
     */
    saveAnalysis(metafile: any, outPath?: string): Promise<void>;
    /**
     * Run the full build pipeline:
     *   1. Main bundle (with tree-shaking + code splitting)
     *   2. Minification (handled by esbuild inline)
     *   3. SSR build (if enabled)
     *   4. Bundle analysis (if enabled)
     */
    build(): Promise<BuildResult>;
}
/**
 * Create a builder instance.
 */
export declare function createBuilder(options: BuildOptions): Builder;
//# sourceMappingURL=index.d.ts.map