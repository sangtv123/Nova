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
    middlewares?: Array<(req: any, res: any, next: () => void) => void>;
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
export function loadConfig(configPath?: string): NovaConfig {
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
export function resolveConfigFile(): string | null {
  const candidates = [
    'nova.config.ts',
    'nova.config.js',
    'nova.config.mjs',
  ];

  // In production would check file system
  return null;
}
