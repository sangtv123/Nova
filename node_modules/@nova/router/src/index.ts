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
export function pathToPattern(filePath: string): { path: string; pattern: RegExp } {
  let pattern = filePath
    .replace(/^pages\//, '')
    .replace(/\.(tsx?|jsx?)$/, '')
    .replace(/\/index$/, '')
    .replace(/^index$/, '')
    .replace(/\[(\w+)\]/g, ':$1');


  if (!pattern) pattern = '/';

  if (!pattern.startsWith('/')) pattern = '/' + pattern;

  // Convert to regex: /posts/:id -> /posts/(?<id>[^/]+)
  const regexPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, '(?<$1>[^\\/]+)');

  return {
    path: pattern,
    pattern: new RegExp(`^${regexPattern}$`),
  };
}

/**
 * Parse URL and extract query parameters
 */
export function parseUrl(urlString: string): {
  pathname: string;
  query: Record<string, string>;
} {
  const url = new URL(urlString, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    pathname: url.pathname,
    query,
  };
}

/**
 * Match route and extract params
 */
export function matchRoute(
  pathname: string,
  routes: Route[]
): RouteMatch | null {
  for (const route of routes) {
    const match = route.pattern.exec(pathname);
    if (match) {
      const params: Record<string, string> = {};
      if (match.groups) {
        Object.assign(params, match.groups);
      }

      return {
        route,
        params,
        query: {},
      };
    }
  }

  return null;
}

/**
 * Router class for client-side navigation with lazy-loaded routes.
 */
export class Router {
  private routes: Map<string, Route> = new Map();
  private currentMatch: RouteMatch | null = null;
  private listeners: Set<(match: RouteMatch | null) => void> = new Set();
  private beforeNavigateHooks: Set<(pathname: string) => GuardResult> = new Set();
  private afterNavigateHooks: Set<(match: RouteMatch) => void> = new Set();

  /**
   * Cache of already-loaded modules — avoids re-importing the same chunk.
   * Key: route path, Value: resolved module exports.
   */
  private moduleCache: Map<string, any> = new Map();

  /**
   * Register a global hook that runs before any navigation.
   */
  onBeforeNavigate(hook: (pathname: string) => GuardResult): () => void {
    this.beforeNavigateHooks.add(hook);
    return () => this.beforeNavigateHooks.delete(hook);
  }

  /**
   * Register a global hook that runs after successful navigation.
   */
  onAfterNavigate(hook: (match: RouteMatch) => void): () => void {
    this.afterNavigateHooks.add(hook);
    return () => this.afterNavigateHooks.delete(hook);
  }

  // ── Route registration ──────────────────────────────────────────────────

  /**
   * Register a lazy route with optional nested layouts, guards, and resolvers.
   */
  registerRoute(
    filePath: string, 
    module: () => Promise<any>, 
    layouts: Array<() => Promise<any>> = [],
    options: Partial<Pick<Route, 'canActivate' | 'resolve' | 'data'>> = {}
  ): void {
    const { path, pattern } = pathToPattern(filePath);
    this.routes.set(path, { 
      path, 
      pattern, 
      module, 
      layouts, 
      ...options 
    });
  }

  // ── Lazy loading helpers ────────────────────────────────────────────────

  /**
   * Inject a `<link rel="modulepreload">` for a route's chunk.
   */
  preload(pathname: string): void {
    if (typeof document === 'undefined') return;
    const route = this._findRoute(pathname);
    if (!route || this.moduleCache.has(route.path)) return;

    const factorySrc = route.module.toString();
    const urlMatch = factorySrc.match(/import\(["']([^"']+)["']\)/);
    if (!urlMatch) return;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = urlMatch[1];
    if (!document.head.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link);
    }
  }

  /**
   * Load a route module and cache it.
   */
  private async loadModule(route: Route): Promise<any> {
    if (this.moduleCache.has(route.path)) {
      return this.moduleCache.get(route.path);
    }
    const mod = await route.module();
    this.moduleCache.set(route.path, mod);
    return mod;
  }

  private _findRoute(pathname: string): Route | null {
    const routeArray = Array.from(this.routes.values());
    for (const route of routeArray) {
      if (route.pattern.test(pathname)) return route;
    }
    return null;
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  /**
   * Navigate to a pathname and resolve all components and nested layouts.
   * Supports Guards (CanActivate) and Resolvers.
   */
  async navigate(pathname: string, skipPushState: boolean = false): Promise<RouteMatch | null> {
    if (!skipPushState && this.currentMatch && window.location.pathname === pathname) {
      return this.currentMatch;
    }

    const routeArray = Array.from(this.routes.values());
    const base = matchRoute(pathname, routeArray);
    if (!base) return null;

    const { query } = parseUrl(pathname);
    base.query = query;

    // 0. Global Before Navigate Hooks
    for (const hook of this.beforeNavigateHooks) {
      const result = await hook(pathname);
      if (result === false) return null;
      if (typeof result === 'string') return this.navigate(result);
    }

    // 1. Run Guards (Angular-style CanActivate)
    if (base.route.canActivate) {
      for (const guard of base.route.canActivate) {
        const result = await guard(base);
        if (result === false) return null; // Cancel navigation
        if (typeof result === 'string') {
          return this.navigate(result); // Redirect
        }
      }
    }

    // 2. Load main component and all layouts in parallel
    const [mod, ...layoutMods] = await Promise.all([
      this.loadModule(base.route),
      ...(base.route.layouts || []).map(l => l())
    ]);

    const component = mod.default ?? mod;
    const layouts = layoutMods.map(m => m.default ?? m);

    const match: RouteMatch = { 
      ...base, 
      component, 
      layouts,
      layout: layouts[0],
      data: { ...(base.route.data || {}) }
    };

    // 3. Run Resolvers (Angular-style Resolve)
    if (base.route.resolve) {
      const resolverKeys = Object.keys(base.route.resolve);
      const resolverPromises = Object.values(base.route.resolve).map(r => r(match));
      const resolvedData = await Promise.all(resolverPromises);
      
      resolverKeys.forEach((key, i) => {
        match.data![key] = resolvedData[i];
      });
    }

    this.currentMatch = match;

    if (!skipPushState) {
      window.history.pushState({}, '', pathname);
    }

    // 4. Global After Navigate Hooks
    for (const hook of this.afterNavigateHooks) {
      hook(match);
    }

    this.notifyListeners(match);
    return match;
  }

  /**
   * Get the current route match (including cached component).
   */
  getCurrentMatch(): RouteMatch | null {
    return this.currentMatch;
  }

  /**
   * Subscribe to route changes.
   * Returns an unsubscribe function.
   */
  subscribe(callback: (match: RouteMatch | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(match: RouteMatch | null): void {
    this.listeners.forEach((cb) => cb(match));
  }

  // ── Init ────────────────────────────────────────────────────────────────

  /**
   * Initialize the router:
   * - Handles browser back/forward (popstate)
   * - Restores scroll position on navigation
   * - Matches the initial URL
   */
  init(): void {
    // Improve scroll restoration — let the router handle it
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, true);
      // Restore scroll for back/forward navigation
      window.scrollTo({ top: 0, behavior: 'instant' });
    });

    // Initial route
    this.navigate(window.location.pathname);
  }
}

/**
 * Singleton router instance.
 */
export const router = new Router();
