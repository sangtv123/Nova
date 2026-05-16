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
export declare class ModuleGraph {
    private modules;
    private fileToId;
    /**
     * Add module to graph
     */
    addModule(id: string, source: string, dependencies?: string[]): ModuleEntry;
    /**
     * Get module entry
     */
    getModule(id: string): ModuleEntry | undefined;
    /**
     * Get all modules that depend on the given module
     */
    getAffectedModules(moduleId: string): Set<string>;
    /**
     * Invalidate module cache
     */
    invalidate(id: string): void;
}
/**
 * Dependency cache
 */
export declare class DependencyCache {
    private cache;
    /**
     * Get cached file
     */
    get(filepath: string): string | null;
    /**
     * Invalidate cache entry
     */
    invalidate(filepath: string): void;
    /**
     * Clear entire cache
     */
    clear(): void;
}
/**
 * ESM transformer - converts CommonJS/TypeScript to ESM
 */
export declare function transformESM(source: string, filename: string): Promise<string>;
/**
 * WebSocket HMR handler
 */
export declare class HMRHandler {
    private clients;
    /**
     * Add client connection
     */
    addClient(ws: any): void;
    /**
     * Remove client connection
     */
    removeClient(ws: any): void;
    /**
     * Broadcast HMR update to all clients
     */
    broadcastUpdate(moduleId: string, newCode: string): void;
    /**
     * Broadcast full page reload
     */
    broadcastReload(): void;
}
export declare class Watcher {
    private watcher;
    /**
     * Watch file for changes
     */
    watch(filepath: string, callback: (event: string, filename: string) => void): () => void;
    /**
     * Watch directory recursively
     */
    watchDir(dirpath: string, callback: (event: string, filename: string) => void): () => void;
}
//# sourceMappingURL=index.d.ts.map