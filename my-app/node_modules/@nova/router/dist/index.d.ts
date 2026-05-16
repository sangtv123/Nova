/**
 * Route definition
 */
export interface Route {
    path: string;
    pattern: RegExp;
    /** Dynamic import factory — the module is fetched only when the route is visited */
    module: () => Promise<any>;
    layout?: () => Promise<any>;
    isSSR?: boolean;
}
/**
 * Route match result — includes the lazily-loaded component
 */
export interface RouteMatch {
    route: Route;
    params: Record<string, string>;
    query: Record<string, string>;
    /** Resolved default export of the route module (available after navigate resolves) */
    component?: any;
    /** Layout component if the route has one */
    layout?: any;
}
/**
 * Convert file-based path to route pattern
 * Examples:
 *   pages/index.tsx -> /
 *   pages/about.tsx -> /about
 *   pages/posts/[id].tsx -> /posts/:id
 */
export declare function pathToPattern(filePath: string): {
    path: string;
    pattern: RegExp;
};
/**
 * Parse URL and extract query parameters
 */
export declare function parseUrl(urlString: string): {
    pathname: string;
    query: Record<string, string>;
};
/**
 * Match route and extract params
 */
export declare function matchRoute(pathname: string, routes: Route[]): RouteMatch | null;
/**
 * Router class for client-side navigation with lazy-loaded routes.
 */
export declare class Router {
    private routes;
    private currentMatch;
    private listeners;
    /**
     * Cache of already-loaded modules — avoids re-importing the same chunk.
     * Key: route path, Value: resolved module exports.
     */
    private moduleCache;
    /**
     * Register a lazy route.
     * `module` must be a dynamic import factory: `() => import('./pages/foo')`
     */
    registerRoute(filePath: string, module: () => Promise<any>, layout?: () => Promise<any>): void;
    /**
     * Inject a `<link rel="modulepreload">` for a route's chunk.
     * Called speculatively (e.g. on hover) so the browser downloads the module
     * before the user actually clicks the link.
     */
    preload(pathname: string): void;
    /**
     * Load a route module and cache it.
     * Subsequent calls for the same route are instant (cache hit).
     */
    private loadModule;
    /**
     * Find the matching Route object for a pathname (without loading it).
     */
    private _findRoute;
    /**
     * Navigate to a pathname.
     * The route module is loaded lazily on first visit; subsequent visits are instant.
     */
    navigate(pathname: string, skipPushState?: boolean): Promise<RouteMatch | null>;
    /**
     * Get the current route match (including cached component).
     */
    getCurrentMatch(): RouteMatch | null;
    /**
     * Subscribe to route changes.
     * Returns an unsubscribe function.
     */
    subscribe(callback: (match: RouteMatch | null) => void): () => void;
    private notifyListeners;
    /**
     * Initialize the router:
     * - Handles browser back/forward (popstate)
     * - Restores scroll position on navigation
     * - Matches the initial URL
     */
    init(): void;
}
/**
 * Singleton router instance.
 */
export declare const router: Router;
//# sourceMappingURL=index.d.ts.map