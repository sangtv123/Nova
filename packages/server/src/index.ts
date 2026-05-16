import * as fs from 'fs';
import * as path from 'path';

/**
 * Module graph entry
 */
export interface ModuleEntry {
  id: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  source: string;
  compiled?: string;
}

/**
 * Module graph - tracks dependencies for HMR
 */
export class ModuleGraph {
  private modules = new Map<string, ModuleEntry>();
  private fileToId = new Map<string, string>();

  /**
   * Add module to graph
   */
  addModule(id: string, source: string, dependencies: string[] = []): ModuleEntry {
    const deps = new Set(dependencies);
    const dependents = new Set<string>();

    const entry: ModuleEntry = {
      id,
      dependencies: deps,
      dependents,
      source,
    };

    this.modules.set(id, entry);

    // Update dependents
    for (const dep of deps) {
      const depEntry = this.modules.get(dep);
      if (depEntry) {
        depEntry.dependents.add(id);
      }
    }

    return entry;
  }

  /**
   * Get module entry
   */
  getModule(id: string): ModuleEntry | undefined {
    return this.modules.get(id);
  }

  /**
   * Get all modules that depend on the given module
   */
  getAffectedModules(moduleId: string): Set<string> {
    const affected = new Set<string>();
    const queue = [moduleId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const entry = this.modules.get(current);

      if (entry) {
        for (const dependent of entry.dependents) {
          if (!affected.has(dependent)) {
            affected.add(dependent);
            queue.push(dependent);
          }
        }
      }
    }

    return affected;
  }

  /**
   * Invalidate module cache
   */
  invalidate(id: string): void {
    const entry = this.modules.get(id);
    if (entry) {
      delete entry.compiled;
    }
  }
}

/**
 * Dependency cache
 */
export class DependencyCache {
  private cache = new Map<string, { mtime: number; content: string }>();

  /**
   * Get cached file
   */
  get(filepath: string): string | null {
    try {
      const stat = fs.statSync(filepath);
      const entry = this.cache.get(filepath);

      if (entry && entry.mtime === stat.mtime.getTime()) {
        return entry.content;
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      this.cache.set(filepath, {
        mtime: stat.mtime.getTime(),
        content,
      });

      return content;
    } catch (e) {
      return null;
    }
  }

  /**
   * Invalidate cache entry
   */
  invalidate(filepath: string): void {
    this.cache.delete(filepath);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * ESM transformer - converts CommonJS/TypeScript to ESM
 */
export async function transformESM(
  source: string,
  filename: string
): Promise<string> {
  // In production, would use esbuild for actual transformation
  // This is a simplified version for demonstration

  let code = source;

  // Add module markers
  if (!code.includes('import ') && !code.includes('export ')) {
    code = `// ESM transformed from: ${filename}\n${code}`;
  }

  return code;
}

/**
 * WebSocket HMR handler
 */
export class HMRHandler {
  private clients = new Set<any>();

  /**
   * Add client connection
   */
  addClient(ws: any): void {
    this.clients.add(ws);
  }

  /**
   * Remove client connection
   */
  removeClient(ws: any): void {
    this.clients.delete(ws);
  }

  /**
   * Broadcast HMR update to all clients
   */
  broadcastUpdate(moduleId: string, newCode: string): void {
    const update = {
      type: 'hmr:update',
      moduleId,
      code: newCode,
      timestamp: Date.now(),
    };

    this.clients.forEach((ws) => {
      try {
        ws.send(JSON.stringify(update));
      } catch (e) {
        // Client disconnected
        this.clients.delete(ws);
      }
    });
  }

  /**
   * Broadcast full page reload
   */
  broadcastReload(): void {
    const update = {
      type: 'hmr:reload',
      timestamp: Date.now(),
    };

    this.clients.forEach((ws) => {
      try {
        ws.send(JSON.stringify(update));
      } catch (e) {
        this.clients.delete(ws);
      }
    });
  }
}

/**
 * Watch mode - monitors files for changes
 */
import { FSWatcher, watch } from 'chokidar';

export class Watcher {
  private watcher: FSWatcher | null = null;

  /**
   * Watch file for changes
   */
  watch(
    filepath: string,
    callback: (event: string, filename: string) => void
  ): () => void {
    try {
      const watcherInstance = watch(filepath, { ignoreInitial: true });
      watcherInstance.on('all', (event: string, path: string) => callback(event, path));
      return () => {
        watcherInstance.close();
      };
    } catch (e) {
      console.error(`Failed to watch ${filepath}:`, e);
      return () => {};
    }
  }

  /**
   * Watch directory recursively
   */
  watchDir(
    dirpath: string,
    callback: (event: string, filename: string) => void
  ): () => void {
    try {
      this.watcher = watch(dirpath, {
        ignoreInitial: true,
        ignored: /(^|[\/\\])\../, // ignore dotfiles
      });
      this.watcher.on('all', (event: string, path: string) => callback(event, path));
      return () => {
        if (this.watcher) this.watcher.close();
      };
    } catch (e) {
      console.error(`Failed to watch directory ${dirpath}:`, e);
      return () => {};
    }
  }
}
/**
 * Streaming Response - Core for Giai đoạn 3
 */
export class StreamingResponse {
  private res: any;
  private hasSentHeader = false;

  constructor(res: any) {
    this.res = res;
  }

  /**
   * Write a chunk of HTML to the stream
   */
  write(chunk: string) {
    if (!this.hasSentHeader) {
      this.res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      });
      this.hasSentHeader = true;
    }
    this.res.write(chunk);
    // Force flush if the stream supports it
    if (this.res.flush) this.res.flush();
  }

  /**
   * Send the initial page shell (head and opening body)
   */
  sendShell(title: string, styles: string[] = [], scripts: string[] = []) {
    this.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${styles.map(s => `<link rel="stylesheet" href="${s}">`).join('\n')}
  ${scripts.map(s => `<script type="module" src="${s}"></script>`).join('\n')}
</head>
<body>
  <div id="app">`);
  }

  /**
   * Send an island placeholder and its hydration data
   */
  sendIsland(id: string, name: string, html: string, props: any) {
    this.write(`<div id="${id}" data-island="${name}">${html}</div>
<script type="hydration">
  window.__HYDRATION_DATA__ = window.__HYDRATION_DATA__ || {};
  window.__HYDRATION_DATA__["${id}"] = ${JSON.stringify(props)};
</script>`);
  }

  /**
   * Close the body and html tags and end the response
   */
  end() {
    this.write(`  </div>
</body>
</html>`);
    this.res.end();
  }
}

/**
 * Helper to create a streaming SSR response
 */
export function createStreamingSSR(res: any) {
  return new StreamingResponse(res);
}
