import fs from 'fs';
import path from 'path';
import { buildSync } from 'esbuild';
import { pathToFileURL } from 'url';

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
export function defineConfig(config: NovaConfig): NovaConfig {
  return config;
}

/**
 * Resolve config file path in workspace
 */
export function resolveConfigFile(): string | null {
  const candidates = [
    'nova.config.ts',
    'nova.config.js',
    'nova.config.mjs',
  ];
  
  for (const candidate of candidates) {
    const fullPath = path.join(process.cwd(), candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

/**
 * Load configuration from file dynamically
 */
export async function loadConfig(configPath?: string): Promise<NovaConfig> {
  const defaultConfig: NovaConfig = {
    root: '.',
    entry: 'src/main.tsx',
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

  const resolvedPath = configPath || resolveConfigFile();
  if (!resolvedPath) {
    return defaultConfig;
  }

  try {
    // Generate a temporary file name next to the config
    const tempFile = path.join(
      path.dirname(resolvedPath),
      `.nova.config.${Date.now()}.mjs`
    );

    // Bundle the TypeScript config on the fly to Standard ES Module
    buildSync({
      entryPoints: [resolvedPath],
      outfile: tempFile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      sourcemap: 'inline',
      packages: 'external', // keep node_modules external
    });

    const fileUrl = pathToFileURL(tempFile).href;
    const module = await import(fileUrl);
    
    // Clean up temporary compiled file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    const userConfig = module.default?.default || module.default;
    
    return {
      ...defaultConfig,
      ...userConfig,
      server: {
        ...defaultConfig.server,
        ...(userConfig?.server || {}),
      },
      build: {
        ...defaultConfig.build,
        ...(userConfig?.build || {}),
      },
    };
  } catch (err) {
    console.error('⚠️  Failed to load nova.config.ts, falling back to defaults.', err);
    return defaultConfig;
  }
}
