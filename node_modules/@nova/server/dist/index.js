import * as fs from 'fs';
/**
 * Module graph - tracks dependencies for HMR
 */
export class ModuleGraph {
    constructor() {
        this.modules = new Map();
        this.fileToId = new Map();
    }
    /**
     * Add module to graph
     */
    addModule(id, source, dependencies = []) {
        const deps = new Set(dependencies);
        const dependents = new Set();
        const entry = {
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
    getModule(id) {
        return this.modules.get(id);
    }
    /**
     * Get all modules that depend on the given module
     */
    getAffectedModules(moduleId) {
        const affected = new Set();
        const queue = [moduleId];
        while (queue.length > 0) {
            const current = queue.shift();
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
    invalidate(id) {
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
    constructor() {
        this.cache = new Map();
    }
    /**
     * Get cached file
     */
    get(filepath) {
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
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Invalidate cache entry
     */
    invalidate(filepath) {
        this.cache.delete(filepath);
    }
    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
    }
}
/**
 * ESM transformer - converts CommonJS/TypeScript to ESM
 */
export async function transformESM(source, filename) {
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
    constructor() {
        this.clients = new Set();
    }
    /**
     * Add client connection
     */
    addClient(ws) {
        this.clients.add(ws);
    }
    /**
     * Remove client connection
     */
    removeClient(ws) {
        this.clients.delete(ws);
    }
    /**
     * Broadcast HMR update to all clients
     */
    broadcastUpdate(moduleId, newCode) {
        const update = {
            type: 'hmr:update',
            moduleId,
            code: newCode,
            timestamp: Date.now(),
        };
        this.clients.forEach((ws) => {
            try {
                ws.send(JSON.stringify(update));
            }
            catch (e) {
                // Client disconnected
                this.clients.delete(ws);
            }
        });
    }
    /**
     * Broadcast full page reload
     */
    broadcastReload() {
        const update = {
            type: 'hmr:reload',
            timestamp: Date.now(),
        };
        this.clients.forEach((ws) => {
            try {
                ws.send(JSON.stringify(update));
            }
            catch (e) {
                this.clients.delete(ws);
            }
        });
    }
}
/**
 * Watch mode - monitors files for changes
 */
import { watch } from 'chokidar';
export class Watcher {
    constructor() {
        this.watcher = null;
    }
    /**
     * Watch file for changes
     */
    watch(filepath, callback) {
        try {
            const watcherInstance = watch(filepath, { ignoreInitial: true });
            watcherInstance.on('all', (event, path) => callback(event, path));
            return () => {
                watcherInstance.close();
            };
        }
        catch (e) {
            console.error(`Failed to watch ${filepath}:`, e);
            return () => { };
        }
    }
    /**
     * Watch directory recursively
     */
    watchDir(dirpath, callback) {
        try {
            this.watcher = watch(dirpath, {
                ignoreInitial: true,
                ignored: /(^|[\/\\])\../, // ignore dotfiles
            });
            this.watcher.on('all', (event, path) => callback(event, path));
            return () => {
                if (this.watcher)
                    this.watcher.close();
            };
        }
        catch (e) {
            console.error(`Failed to watch directory ${dirpath}:`, e);
            return () => { };
        }
    }
}
//# sourceMappingURL=index.js.map