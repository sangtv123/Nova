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

  /**
   * Cache of already-loaded modules — avoids re-importing the same chunk.
   * Key: route path, Value: resolved module exports.
   */
  private moduleCache: Map<string, any> = new Map();

  // ── Route registration ──────────────────────────────────────────────────

  /**
   * Register a lazy route.
   * `module` must be a dynamic import factory: `() => import('./pages/foo')`
   */
  registerRoute(filePath: string, module: () => Promise<any>, layout?: () => Promise<any>): void {
    const { path, pattern } = pathToPattern(filePath);
    this.routes.set(path, { path, pattern, module, layout });
  }

  // ── Lazy loading helpers ────────────────────────────────────────────────

  /**
   * Inject a `<link rel="modulepreload">` for a route's chunk.
   * Called speculatively (e.g. on hover) so the browser downloads the module
   * before the user actually clicks the link.
   */
  preload(pathname: string): void {
    if (typeof document === 'undefined') return;
    const route = this._findRoute(pathname);
    if (!route || this.moduleCache.has(route.path)) return;

    // Extract the URL from the import factory string representation
    // Works with bundlers that encode the chunk path in the factory source
    const factorySrc = route.module.toString();
    const urlMatch = factorySrc.match(/import\(["']([^"']+)["']\)/);
    if (!urlMatch) return;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = urlMatch[1];
    // Avoid duplicate preload hints
    if (!document.head.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link);
    }
  }

  /**
   * Load a route module and cache it.
   * Subsequent calls for the same route are instant (cache hit).
   */
  private async loadModule(route: Route): Promise<any> {
    if (this.moduleCache.has(route.path)) {
      return this.moduleCache.get(route.path);
    }
    const mod = await route.module();
    this.moduleCache.set(route.path, mod);
    return mod;
  }

  /**
   * Find the matching Route object for a pathname (without loading it).
   */
  private _findRoute(pathname: string): Route | null {
    const routeArray = Array.from(this.routes.values());
    for (const route of routeArray) {
      if (route.pattern.test(pathname)) return route;
    }
    return null;
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  /**
   * Navigate to a pathname.
   * The route module is loaded lazily on first visit; subsequent visits are instant.
   */
  async navigate(pathname: string, skipPushState: boolean = false): Promise<RouteMatch | null> {
    // Avoid redundant navigation if already on the same path (except for initial load)
    if (!skipPushState && this.currentMatch && window.location.pathname === pathname) {
      return this.currentMatch;
    }

    const routeArray = Array.from(this.routes.values());
    const base = matchRoute(pathname, routeArray);
    if (!base) return null;

    // Parse query string
    const { query } = parseUrl(pathname);
    base.query = query;

    // Lazy-load the route component
    const mod = await this.loadModule(base.route);
    const component = mod.default ?? mod;

    // Lazy-load layout if present
    let layout: any;
    if (base.route.layout) {
      const layoutMod = await base.route.layout();
      layout = layoutMod.default ?? layoutMod;
    }

    const match: RouteMatch = { ...base, component, layout };
    this.currentMatch = match;

    if (!skipPushState) {
      window.history.pushState({}, '', pathname);
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
