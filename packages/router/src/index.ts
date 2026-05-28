export type GuardResult = boolean | string | Promise<boolean | string>;
export type GuardFn = (match: RouteMatch) => GuardResult;
export type ResolveFn = (match: RouteMatch) => any | Promise<any>;

export interface Route {
  path: string;
  pattern: RegExp;
  /** Optional unique name for type-safe navigation via router.navigateTo() */
  name?: string;
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
  public useHash: boolean = false;

  /**
   * Cache of already-loaded modules — avoids re-importing the same chunk.
   * Key: route path, Value: resolved module exports.
   */
  private moduleCache: Map<string, any> = new Map();

  /**
   * Cache of scroll positions for each page.
   */
  private scrollPositions: Map<string, { x: number; y: number }> = new Map();

  /**
   * Index of named routes — maps route name → path for type-safe navigation.
   */
  private nameIndex: Map<string, string> = new Map();

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
    module: (() => Promise<any>) | null,
    layouts: Array<() => Promise<any>> = [],
    options: Partial<Pick<Route, 'canActivate' | 'resolve' | 'data' | 'name'>> = {}
  ): void {
    const { path, pattern } = pathToPattern(filePath);
    const existing = this.routes.get(path);
    if (existing) {
      // Merge with existing route config (e.g. from custom setupRoutes vs auto-injected)
      const merged: Route = {
        ...existing,
        module: module || existing.module,
        layouts: layouts.length > 0 ? layouts : existing.layouts,
        canActivate: options.canActivate || existing.canActivate,
        resolve: options.resolve || existing.resolve,
        data: { ...existing.data, ...options.data },
      };
      if (options.name) {
        merged.name = options.name;
        this.nameIndex.set(options.name, path);
      }
      this.routes.set(path, merged);
    } else {
      const route: Route = {
        path,
        pattern,
        module: module as () => Promise<any>,
        layouts,
        ...options,
      };
      this.routes.set(path, route);
      if (options.name) {
        this.nameIndex.set(options.name, path);
      }
    }
  }

  /**
   * Navigate to a route by its registered name and optional params.
   *
   * @example
   * router.navigateTo('user-detail', { id: '42' }); // → /users/42
   */
  navigateTo(name: string, params: Record<string, string> = {}): Promise<RouteMatch | null> {
    const path = this.nameIndex.get(name);
    if (!path) {
      console.warn(`[nova/router] No route registered with name "${name}".`);
      return Promise.resolve(null);
    }
    // Replace :param placeholders with provided values
    const resolved = path.replace(/:([\w]+)/g, (_, key) => {
      if (!(key in params)) {
        console.warn(`[nova/router] navigateTo("${name}"): missing param "${key}".`);
        return `:${key}`;
      }
      return encodeURIComponent(params[key]);
    });
    return this.navigate(resolved);
  }

  /**
   * Resolve a named route to its full path string without navigating.
   * Useful for building href values in templates.
   */
  resolve(name: string, params: Record<string, string> = {}): string | null {
    const path = this.nameIndex.get(name);
    if (!path) return null;
    return path.replace(/:([\w]+)/g, (_, key) =>
      key in params ? encodeURIComponent(params[key]) : `:${key}`
    );
  }

  /**
   * Returns true if the given pathname matches the currently active route.
   */
  isActive(pathname: string): boolean {
    if (!this.currentMatch) return false;
    return this.currentMatch.route.path === this._findRoute(pathname)?.path;
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
    // Robust regex matching single quotes, double quotes, backticks, spacing, and comments inside import()
    const urlMatch = factorySrc.match(/import\(\s*(?:\/\*[\s\S]*?\*\/)?\s*["'`]([^"'`]+)["'`]\s*\)/);
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
    const currentPath = this.useHash 
      ? window.location.hash.replace(/^#/, '') || '/'
      : window.location.pathname;

    // Cache scroll position before leaving the current page
    if (typeof window !== 'undefined') {
      this.scrollPositions.set(currentPath, { x: window.scrollX, y: window.scrollY });
    }

    if (!skipPushState && this.currentMatch && currentPath === pathname) {
      return this.currentMatch;
    }

    const routeArray = Array.from(this.routes.values());
    const base = matchRoute(pathname, routeArray);
    
    if (!base) {
      this.currentMatch = null;
      if (!skipPushState) {
        const urlToPush = this.useHash ? `#${pathname}` : pathname;
        window.history.pushState({}, '', urlToPush);
      }
      this.notifyListeners(null);
      return null;
    }

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

    const extractComponent = (m: any) => {
      if (m.default) return m.default;
      if (typeof m === 'function') return m;
      if (m && typeof m === 'object') {
        const exportedFn = Object.values(m).find(v => typeof v === 'function');
        if (exportedFn) return exportedFn;
      }
      return m;
    };

    const component = extractComponent(mod);
    const layouts = layoutMods.map(extractComponent);

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
      const urlToPush = this.useHash ? `#${pathname}` : pathname;
      window.history.pushState({}, '', urlToPush);
    }

    // 4. Global After Navigate Hooks
    for (const hook of this.afterNavigateHooks) {
      hook(match);
    }

    this.notifyListeners(match);

    // Restore scroll position or scroll to top after the page has rendered
    if (typeof window !== 'undefined') {
      if (skipPushState) {
        const pos = this.scrollPositions.get(pathname) || { x: 0, y: 0 };
        window.scrollTo(pos.x, pos.y);
      } else {
        window.scrollTo(0, 0);
      }
    }

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
  init(options?: { useHash?: boolean }): void {
    // Determine hash mode: explicitly set or implicitly from initial URL having '#/'
    this.useHash = options?.useHash ?? window.location.hash.startsWith('#/');

    // Improve scroll restoration — let the router handle it
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    window.addEventListener('popstate', () => {
      const path = this.useHash 
        ? window.location.hash.replace(/^#/, '') || '/'
        : window.location.pathname;
      this.navigate(path, true);
    });

    // Initial route
    const initialPath = this.useHash
      ? window.location.hash.replace(/^#/, '') || '/'
      : window.location.pathname;
      
    this.navigate(initialPath);
  }
}

/**
 * Singleton router instance.
 */
export const router = new Router();

// ─── useRouter hook ───────────────────────────────────────────────────────────

/**
 * `useRouter` — returns the singleton router instance.
 * Convenience alias for importing `router` with a hook-style name.
 *
 * @example
 * const { navigate, navigateTo, isActive } = useRouter();
 */
export function useRouter(): Router {
  return router;
}

// ─── <Link> component ─────────────────────────────────────────────────────────

export interface LinkProps {
  /** Target pathname or named route descriptor */
  to: string | { name: string; params?: Record<string, string> };
  /** Extra CSS class(es) */
  class?: string;
  /** CSS class applied when this link's route is active */
  activeClass?: string;
  children?: any;
  [key: string]: any;
}

/**
 * `<Link>` — a thin wrapper around `<a>` that integrates with the Nova router.
 *
 * - Resolves named routes automatically.
 * - Calls `router.navigate()` on click (no full page reload).
 * - Applies `activeClass` (default `'active'`) when the link's route is current.
 *
 * @example
 * <Link to="/about">About</Link>
 * <Link to={{ name: 'user-detail', params: { id: '42' } }} activeClass="nav--active">
 *   View User
 * </Link>
 */
export function Link(props: LinkProps): Element {
  const { to, class: className, activeClass = 'active', children, ...rest } = props;

  // Resolve href from string or named route
  let href: string;
  if (typeof to === 'string') {
    href = to;
  } else {
    href = router.resolve(to.name, to.params ?? '') ?? '#';
  }

  const isCurrentlyActive = router.isActive(href);

  const classes = [
    className,
    isCurrentlyActive ? activeClass : '',
  ].filter(Boolean).join(' ');

  // Create the anchor element
  const el = document.createElement('a');
  el.href = href;
  if (classes) el.className = classes;

  // Merge any extra props (aria-*, data-*, id, etc.)
  for (const [key, value] of Object.entries(rest)) {
    if (key === 'children') continue;
    if (value != null) el.setAttribute(key, String(value));
  }

  // Append children
  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    if (child == null) continue;
    if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }

  // Client-side navigation — no full reload
  el.addEventListener('click', (e: MouseEvent) => {
    // Allow Ctrl/Cmd+Click, middle-click etc. to open in new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    router.navigate(href);
  });

  return el;
}
