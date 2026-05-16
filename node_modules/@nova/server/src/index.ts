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
