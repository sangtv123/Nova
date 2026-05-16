/**
 * Load configuration from file
 */
export function loadConfig(configPath) {
    return {
        root: '.',
        entry: 'src/main.ts',
        outDir: 'dist',
        publicDir: 'public',
        ssr: false,
        minify: true,
        server: {
            port: 3000,
            host: 'localhost',
            hmr: true,
        },
    };
}
/**
 * Resolve config file
 */
export function resolveConfigFile() {
    const candidates = [
        'nova.config.ts',
        'nova.config.js',
        'nova.config.mjs',
    ];
    // In production would check file system
    return null;
}
//# sourceMappingURL=config.js.map