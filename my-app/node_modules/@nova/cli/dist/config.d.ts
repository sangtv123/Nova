/**
 * Nova configuration
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
    server?: {
        port?: number;
        host?: string;
        hmr?: boolean;
    };
    build?: {
        target?: string;
        minify?: boolean;
        sourcemap?: boolean;
    };
}
/**
 * Load configuration from file
 */
export declare function loadConfig(configPath?: string): NovaConfig;
/**
 * Resolve config file
 */
export declare function resolveConfigFile(): string | null;
//# sourceMappingURL=config.d.ts.map