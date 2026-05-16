import { signal, computed } from '@nova/signals';
// ─── Error class ──────────────────────────────────────────────────────────────
export class HttpError extends Error {
    constructor(message, status, response, config) {
        super(message);
        this.status = status;
        this.response = response;
        this.config = config;
        this.name = 'HttpError';
    }
    get isNetworkError() { return this.status === null; }
    get isTimeout() { return this.message.includes('timeout'); }
    get isAborted() { return this.message.includes('aborted'); }
    get isClientError() { return this.status !== null && this.status >= 400 && this.status < 500; }
    get isServerError() { return this.status !== null && this.status >= 500; }
}
class ResponseCache {
    constructor() {
        this.store = new Map();
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data, ttl = 0) {
        this.store.set(key, {
            data,
            expiresAt: ttl > 0 ? Date.now() + ttl : 0,
        });
    }
    delete(key) { this.store.delete(key); }
    clear() { this.store.clear(); }
    get size() { return this.store.size; }
}
// ─── Query string builder ─────────────────────────────────────────────────────
function buildUrl(base, params) {
    if (!params)
        return base;
    const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            url.searchParams.set(key, String(value));
        }
    }
    // Return full URL or just path+search depending on whether it's absolute
    return base.startsWith('http') ? url.toString() : url.pathname + url.search;
}
// ─── Sleep helper ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// ─── Nova HTTP Client ─────────────────────────────────────────────────────────
export class NovaHttpClient {
    constructor(defaults = {}) {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
        this.cache = new ResponseCache();
        this.defaults = {
            timeout: 10000,
            retry: 0,
            retryDelay: 300,
            retryOn: [408, 429, 500, 502, 503, 504],
            responseType: 'json',
            ...defaults,
        };
    }
    // ── Interceptors ─────────────────────────────────────────────────────────
    /** Add a request interceptor. Returns an unregister function. */
    useRequest(interceptor) {
        this.requestInterceptors.push(interceptor);
        return () => { this.requestInterceptors = this.requestInterceptors.filter(i => i !== interceptor); };
    }
    /** Add a response interceptor. Returns an unregister function. */
    useResponse(interceptor) {
        this.responseInterceptors.push(interceptor);
        return () => { this.responseInterceptors = this.responseInterceptors.filter(i => i !== interceptor); };
    }
    /** Add an error interceptor. Returns an unregister function. */
    useError(interceptor) {
        this.errorInterceptors.push(interceptor);
        return () => { this.errorInterceptors = this.errorInterceptors.filter(i => i !== interceptor); };
    }
    // ── Cache control ─────────────────────────────────────────────────────────
    clearCache(key) {
        key ? this.cache.delete(key) : this.cache.clear();
    }
    // ── Core request ─────────────────────────────────────────────────────────
    async request(method, url, config = {}) {
        const merged = { ...this.defaults, ...config };
        const baseUrl = merged.baseUrl ?? '';
        const fullUrl = buildUrl(`${baseUrl}${url}`, merged.params);
        let finalConfig = { ...merged, url: fullUrl, method };
        // Run request interceptors
        for (const interceptor of this.requestInterceptors) {
            finalConfig = await interceptor(finalConfig);
        }
        // Cache hit (GET-only)
        if (method === 'GET' && finalConfig.cacheKey) {
            const cached = this.cache.get(finalConfig.cacheKey);
            if (cached !== null) {
                return {
                    data: cached,
                    status: 200,
                    statusText: 'OK (cached)',
                    headers: new Headers(),
                    config: finalConfig,
                };
            }
        }
        // Attempt with retry
        const maxAttempts = 1 + (finalConfig.retry ?? 0);
        const retryOn = finalConfig.retryOn ?? [408, 429, 500, 502, 503, 504];
        const retryDelay = finalConfig.retryDelay ?? 300;
        let lastError = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (attempt > 0)
                await sleep(retryDelay * attempt); // exponential-ish backoff
            try {
                const response = await this._fetch(finalConfig);
                // Run response interceptors
                let result = response;
                for (const interceptor of this.responseInterceptors) {
                    result = (await interceptor(result));
                }
                // Cache successful GET
                if (method === 'GET' && finalConfig.cacheKey) {
                    this.cache.set(finalConfig.cacheKey, result.data, finalConfig.cacheTtl);
                }
                return result;
            }
            catch (err) {
                const httpErr = err instanceof HttpError ? err : new HttpError(String(err), null, null, finalConfig);
                // Should retry?
                const shouldRetry = attempt < maxAttempts - 1 &&
                    (httpErr.isNetworkError || (httpErr.status !== null && retryOn.includes(httpErr.status)));
                if (!shouldRetry) {
                    // Run error interceptors
                    let thrownError = httpErr;
                    for (const interceptor of this.errorInterceptors) {
                        const result = await interceptor(thrownError);
                        if (!(result instanceof HttpError)) {
                            // Interceptor recovered — return as success
                            return result;
                        }
                        thrownError = result;
                    }
                    throw thrownError;
                }
                lastError = httpErr;
            }
        }
        throw lastError;
    }
    /** Internal fetch execution with timeout + AbortController */
    async _fetch(config) {
        const controller = new AbortController();
        const externalSignal = config.signal;
        // Forward external abort signal
        externalSignal?.addEventListener('abort', () => controller.abort(externalSignal.reason));
        // Timeout
        let timeoutId = null;
        if (config.timeout && config.timeout > 0) {
            timeoutId = setTimeout(() => controller.abort('timeout'), config.timeout);
        }
        const headers = new Headers({ 'Content-Type': 'application/json', ...config.headers });
        const init = {
            method: config.method,
            headers,
            signal: controller.signal,
        };
        if (config.body !== undefined && !['GET', 'HEAD'].includes(config.method)) {
            init.body = JSON.stringify(config.body);
        }
        try {
            const res = await fetch(config.url, init);
            // Parse body
            const responseType = config.responseType ?? 'json';
            let data;
            if (responseType === 'json') {
                // Safely parse — some 204 No Content responses have no body
                const text = await res.text();
                data = text ? JSON.parse(text) : null;
            }
            else if (responseType === 'text') {
                data = await res.text();
            }
            else if (responseType === 'blob') {
                data = await res.blob();
            }
            else if (responseType === 'arrayBuffer') {
                data = await res.arrayBuffer();
            }
            else {
                data = null;
            }
            const httpResponse = {
                data,
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
                config,
            };
            if (!res.ok) {
                throw new HttpError(`HTTP ${res.status}: ${res.statusText}`, res.status, httpResponse, config);
            }
            return httpResponse;
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            const isAbort = err instanceof DOMException && err.name === 'AbortError';
            const reason = controller.signal.reason;
            const message = reason === 'timeout'
                ? `Request timeout after ${config.timeout}ms`
                : isAbort
                    ? 'Request aborted'
                    : String(err);
            throw new HttpError(message, null, null, config);
        }
        finally {
            if (timeoutId !== null)
                clearTimeout(timeoutId);
        }
    }
    // ── Shorthand methods ─────────────────────────────────────────────────────
    get(url, config) { return this.request('GET', url, config); }
    post(url, body, config) { return this.request('POST', url, { ...config, body }); }
    put(url, body, config) { return this.request('PUT', url, { ...config, body }); }
    patch(url, body, config) { return this.request('PATCH', url, { ...config, body }); }
    delete(url, config) { return this.request('DELETE', url, config); }
    head(url, config) { return this.request('HEAD', url, config); }
    /** Create a child client that inherits interceptors + defaults */
    create(overrides = {}) {
        const child = new NovaHttpClient({ ...this.defaults, ...overrides });
        child.requestInterceptors = [...this.requestInterceptors];
        child.responseInterceptors = [...this.responseInterceptors];
        child.errorInterceptors = [...this.errorInterceptors];
        return child;
    }
}
/**
 * `useHttp` — reactive wrapper around NovaHttpClient.
 *
 * Returns signals for `data`, `loading`, `error`, and `status`
 * that update automatically when the request completes or fails.
 *
 * @example
 * const { data, loading, error, execute } = useHttp<User[]>('/api/users');
 * // In JSX:
 * //   {() => loading.value ? <Spinner /> : <UserList users={data.value} />}
 */
export function useHttp(client, method, url, options = {}) {
    const { immediate = true, transform, initialData, ...reqConfig } = options;
    const data = signal(initialData ?? null);
    const loading = signal(false);
    const error = signal(null);
    const status = signal(null);
    const isReady = computed(() => !loading.value && data.value !== null && error.value === null);
    let controller = null;
    const abort = () => {
        controller?.abort();
        controller = null;
    };
    const execute = async (overrides = {}) => {
        abort(); // cancel any in-flight request
        controller = new AbortController();
        loading.value = true;
        error.value = null;
        try {
            const res = await client.request(method, url, {
                ...reqConfig,
                ...overrides,
                signal: controller.signal,
            });
            status.value = res.status;
            data.value = transform ? transform(res.data) : res.data;
        }
        catch (err) {
            if (err instanceof HttpError && err.isAborted)
                return; // intentional cancel
            error.value = err instanceof HttpError ? err : new HttpError(String(err), null, null, { url, method });
            status.value = err instanceof HttpError ? err.status : null;
        }
        finally {
            loading.value = false;
        }
    };
    if (immediate) {
        // Defer to next microtask so signals are registered before first run
        Promise.resolve().then(() => execute());
    }
    return { data, loading, error, status, isReady, execute, abort };
}
// ─── Singleton default client ─────────────────────────────────────────────────
/**
 * Default global client — use `http.create()` to derive scoped clients
 * (e.g., one per API domain or auth context).
 */
export const http = new NovaHttpClient();
// ─── Convenience factory ──────────────────────────────────────────────────────
/**
 * Create a new client with custom defaults.
 *
 * @example
 * const api = createHttpClient({ baseUrl: 'https://api.example.com', timeout: 5000 });
 * api.useRequest(cfg => { cfg.headers!['Authorization'] = `Bearer ${token}`; return cfg; });
 */
export function createHttpClient(defaults = {}) {
    return new NovaHttpClient(defaults);
}
//# sourceMappingURL=index.js.map