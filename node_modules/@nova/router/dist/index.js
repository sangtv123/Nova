/**
 * Convert file-based path to route pattern
 * Examples:
 *   pages/index.tsx -> /
 *   pages/about.tsx -> /about
 *   pages/posts/[id].tsx -> /posts/:id
 */
export function pathToPattern(filePath) {
    let pattern = filePath
        .replace(/^pages\//, '')
        .replace(/\.(tsx?|jsx?)$/, '')
        .replace(/\/index$/, '')
        .replace(/^index$/, '')
        .replace(/\[(\w+)\]/g, ':$1');
    if (!pattern)
        pattern = '/';
    if (!pattern.startsWith('/'))
        pattern = '/' + pattern;
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
export function parseUrl(urlString) {
    const url = new URL(urlString, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const query = {};
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
export function matchRoute(pathname, routes) {
    for (const route of routes) {
        const match = route.pattern.exec(pathname);
        if (match) {
            const params = {};
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
    constructor() {
        this.routes = new Map();
        this.currentMatch = null;
        this.listeners = new Set();
        this.beforeNavigateHooks = new Set();
        this.afterNavigateHooks = new Set();
        /**
         * Cache of already-loaded modules — avoids re-importing the same chunk.
         * Key: route path, Value: resolved module exports.
         */
        this.moduleCache = new Map();
    }
    /**
     * Register a global hook that runs before any navigation.
     */
    onBeforeNavigate(hook) {
        this.beforeNavigateHooks.add(hook);
        return () => this.beforeNavigateHooks.delete(hook);
    }
    /**
     * Register a global hook that runs after successful navigation.
     */
    onAfterNavigate(hook) {
        this.afterNavigateHooks.add(hook);
        return () => this.afterNavigateHooks.delete(hook);
    }
    // ── Route registration ──────────────────────────────────────────────────
    /**
     * Register a lazy route with optional nested layouts, guards, and resolvers.
     */
    registerRoute(filePath, module, layouts = [], options = {}) {
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
    preload(pathname) {
        if (typeof document === 'undefined')
            return;
        const route = this._findRoute(pathname);
        if (!route || this.moduleCache.has(route.path))
            return;
        const factorySrc = route.module.toString();
        const urlMatch = factorySrc.match(/import\(["']([^"']+)["']\)/);
        if (!urlMatch)
            return;
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
    async loadModule(route) {
        if (this.moduleCache.has(route.path)) {
            return this.moduleCache.get(route.path);
        }
        const mod = await route.module();
        this.moduleCache.set(route.path, mod);
        return mod;
    }
    _findRoute(pathname) {
        const routeArray = Array.from(this.routes.values());
        for (const route of routeArray) {
            if (route.pattern.test(pathname))
                return route;
        }
        return null;
    }
    // ── Navigation ─────────────────────────────────────────────────────────
    /**
     * Navigate to a pathname and resolve all components and nested layouts.
     * Supports Guards (CanActivate) and Resolvers.
     */
    async navigate(pathname, skipPushState = false) {
        if (!skipPushState && this.currentMatch && window.location.pathname === pathname) {
            return this.currentMatch;
        }
        const routeArray = Array.from(this.routes.values());
        const base = matchRoute(pathname, routeArray);
        if (!base)
            return null;
        const { query } = parseUrl(pathname);
        base.query = query;
        // 0. Global Before Navigate Hooks
        for (const hook of this.beforeNavigateHooks) {
            const result = await hook(pathname);
            if (result === false)
                return null;
            if (typeof result === 'string')
                return this.navigate(result);
        }
        // 1. Run Guards (Angular-style CanActivate)
        if (base.route.canActivate) {
            for (const guard of base.route.canActivate) {
                const result = await guard(base);
                if (result === false)
                    return null; // Cancel navigation
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
        const match = {
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
                match.data[key] = resolvedData[i];
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
    getCurrentMatch() {
        return this.currentMatch;
    }
    /**
     * Subscribe to route changes.
     * Returns an unsubscribe function.
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    notifyListeners(match) {
        this.listeners.forEach((cb) => cb(match));
    }
    // ── Init ────────────────────────────────────────────────────────────────
    /**
     * Initialize the router:
     * - Handles browser back/forward (popstate)
     * - Restores scroll position on navigation
     * - Matches the initial URL
     */
    init() {
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
//# sourceMappingURL=index.js.map