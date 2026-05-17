/**
 * Nova configuration interface
 */
export interface NovaConfig {
    root?: string;
    entry?: string;
    outDir?: string;
    publicDir?: string;
    mode?: 'dev' | 'prod';
    ssr?: boolean;
    minify?: boolean;
    sourcemap?: boolean;
    plugins?: any[];
    customPipes?: string[];
    server?: {
        port?: number;
        host?: string;
        hmr?: boolean;
        middlewares?: Array<(req: any, res: any, next: () => void) => void>;
    };
    build?: {
        target?: string;
        minify?: boolean;
        sourcemap?: boolean;
    };
}
/**
 * Utility to define config with type safety
 */
export declare function defineConfig(config: NovaConfig): NovaConfig;
/**
 * Resolve config file path in workspace
 */
export declare function resolveConfigFile(): string | null;
/**
 * Load configuration from file dynamically
 */
export declare function loadConfig(configPath?: string): Promise<NovaConfig>;
//# sourceMappingURL=config.d.ts.map