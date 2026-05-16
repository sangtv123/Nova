export type GuardResult = boolean | string | Promise<boolean | string>;
export type GuardFn = (match: RouteMatch) => GuardResult;
export type ResolveFn = (match: RouteMatch) => any | Promise<any>;
export interface Route {
    path: string;
    pattern: RegExp;
    /** Dynamic import factory — the module is fetched only when the route is visited */
    module: () => Promise<any>;
    /** Stack of layout factories, from root to leaf */
    layouts?: Array<() => Promise<any>>;
    /** Angular-style Guards: check if route can be activated */
    canActivate?: GuardFn[];
    /** Angular-style Resolvers: fetch data before route is activated */
    resolve?: Record<string, ResolveFn>;
    /** Static data passed to the route */
    data?: Record<string, any>;
    isSSR?: boolean;
}
/**
 * Route match result — includes the lazily-loaded component
 */
export interface RouteMatch {
    route: Route;
    params: Record<string, string>;
    query: Record<string, string>;
    /** Resolved default export of the route module */
    component?: any;
    /** Resolved layout components */
    layouts?: any[];
    /** Resolved data from Resolvers */
    data?: Record<string, any>;
    /** Outermost layout for backward compatibility */
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
    private beforeNavigateHooks;
    private afterNavigateHooks;
    /**
     * Cache of already-loaded modules — avoids re-importing the same chunk.
     * Key: route path, Value: resolved module exports.
     */
    private moduleCache;
    /**
     * Register a global hook that runs before any navigation.
     */
    onBeforeNavigate(hook: (pathname: string) => GuardResult): () => void;
    /**
     * Register a global hook that runs after successful navigation.
     */
    onAfterNavigate(hook: (match: RouteMatch) => void): () => void;
    /**
     * Register a lazy route with optional nested layouts, guards, and resolvers.
     */
    registerRoute(filePath: string, module: () => Promise<any>, layouts?: Array<() => Promise<any>>, options?: Partial<Pick<Route, 'canActivate' | 'resolve' | 'data'>>): void;
    /**
     * Inject a `<link rel="modulepreload">` for a route's chunk.
     */
    preload(pathname: string): void;
    /**
     * Load a route module and cache it.
     */
    private loadModule;
    private _findRoute;
    /**
     * Navigate to a pathname and resolve all components and nested layouts.
     * Supports Guards (CanActivate) and Resolvers.
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