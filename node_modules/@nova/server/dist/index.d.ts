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
/**
 * Streaming Response - Core for Giai đoạn 3
 */
export declare class StreamingResponse {
    private res;
    private hasSentHeader;
    constructor(res: any);
    /**
     * Write a chunk of HTML to the stream
     */
    write(chunk: string): void;
    /**
     * Send the initial page shell (head and opening body)
     */
    sendShell(title: string, styles?: string[], scripts?: string[]): void;
    /**
     * Send an island placeholder and its hydration data
     */
    sendIsland(id: string, name: string, html: string, props: any): void;
    /**
     * Close the body and html tags and end the response
     */
    end(): void;
}
/**
 * Helper to create a streaming SSR response
 */
export declare function createStreamingSSR(res: any): StreamingResponse;
//# sourceMappingURL=index.d.ts.map