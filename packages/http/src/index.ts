import { signal, computed } from '@nova/signals';
import type { Signal } from '@nova/signals';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface HttpRequestConfig {
  /** Base URL prepended to all requests */
  baseUrl?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters appended to the URL */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Request body (auto-serialized to JSON) */
  body?: unknown;
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts on network failure (default: 0) */
  retry?: number;
  /** Delay between retries in ms (default: 300) */
  retryDelay?: number;
  /** Status codes that trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryOn?: number[];
  /** AbortSignal for manual cancellation */
  signal?: AbortSignal;
  /** Response type (default: 'json') */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'none';
  /** Cache key — if set, response is cached in-memory and shared across subscribers */
  cacheKey?: string;
  /** Cache TTL in milliseconds (default: 0 = no expiry). Used for automated Garbage Collection */
  cacheTtl?: number;
  /** Time in ms before cached data is considered stale for background revalidation (default: 0) */
  staleTime?: number;
  /** Arbitrary metadata passed through to interceptors */
  meta?: Record<string, unknown>;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: HttpRequestConfig & { url: string; method: HttpMethod };
}

export type RequestInterceptor = (
  config: HttpRequestConfig & { url: string; method: HttpMethod }
) => (HttpRequestConfig & { url: string; method: HttpMethod }) | Promise<HttpRequestConfig & { url: string; method: HttpMethod }>;

export type ResponseInterceptor<T = unknown> = (
  response: HttpResponse<T>
) => HttpResponse<T> | Promise<HttpResponse<T>>;

export type ErrorInterceptor = (
  error: HttpError
) => HttpError | Promise<HttpError | HttpResponse<unknown>>;

export type CacheListener<T = unknown> = (data: T | null, isValidated?: boolean) => void;

// ─── Error class ──────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly response: HttpResponse<unknown> | null,
    public readonly config: HttpRequestConfig & { url: string; method: HttpMethod }
  ) {
    super(message);
    this.name = 'HttpError';
  }

  get isNetworkError() { return this.status === null; }
  get isTimeout()      { return this.message.includes('timeout'); }
  get isAborted()      { return this.message.includes('aborted'); }
  get isClientError()  { return this.status !== null && this.status >= 400 && this.status < 500; }
  get isServerError()  { return this.status !== null && this.status >= 500; }
}

// ─── Smart Cache Engine (with GC & PubSub) ────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  updatedAt: number;
  expiresAt: number; // For Garbage Collection
  staleAt: number;   // For Stale-While-Revalidate
  gcTimeoutId?: ReturnType<typeof setTimeout>;
}

class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private listeners = new Map<string, Set<CacheListener>>();

  get<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.store.get(key);
    if (!entry) return { data: null, isStale: true };

    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.delete(key);
      return { data: null, isStale: true };
    }

    const isStale = entry.staleAt > 0 ? Date.now() > entry.staleAt : false;
    return { data: entry.data as T, isStale };
  }

  set<T>(key: string, data: T, ttl = 0, staleTime = 0): void {
    const existing = this.store.get(key);
    if (existing?.gcTimeoutId) {
      clearTimeout(existing.gcTimeoutId);
    }

    const now = Date.now();
    const expiresAt = ttl > 0 ? now + ttl : 0;
    const staleAt   = staleTime > 0 ? now + staleTime : now;

    let gcTimeoutId: ReturnType<typeof setTimeout> | undefined;
    if (ttl > 0) {
      // Smart automated garbage collection sweep
      gcTimeoutId = setTimeout(() => {
        this.delete(key);
      }, ttl);
    }

    this.store.set(key, { data, updatedAt: now, expiresAt, staleAt, gcTimeoutId });
    this.notify(key, data, true);
  }

  delete(key: string): void {
    const existing = this.store.get(key);
    if (existing?.gcTimeoutId) {
      clearTimeout(existing.gcTimeoutId);
    }
    this.store.delete(key);
    this.notify(key, null, false);
  }

  clear(): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.gcTimeoutId) clearTimeout(entry.gcTimeoutId);
      this.notify(key, null, false);
    }
    this.store.clear();
  }

  subscribe<T>(key: string, listener: CacheListener<T>): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener as CacheListener);

    return () => {
      set?.delete(listener as CacheListener);
      if (set?.size === 0) this.listeners.delete(key);
    };
  }

  private notify(key: string, data: unknown | null, isValidated: boolean): void {
    const set = this.listeners.get(key);
    if (set) {
      for (const listener of set) {
        listener(data, isValidated);
      }
    }
  }

  get size() { return this.store.size; }
}

// ─── Query string builder ─────────────────────────────────────────────────────

function buildUrl(base: string, params?: HttpRequestConfig['params']): string {
  if (!params) return base;
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return base.startsWith('http') ? url.toString() : url.pathname + url.search;
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ─── Nova HTTP Client ─────────────────────────────────────────────────────────

export class NovaHttpClient {
  private requestInterceptors: RequestInterceptor[]  = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[]       = [];
  public cache = new ResponseCache();
  private inFlightPromises = new Map<string, Promise<HttpResponse<any>>>();
  private defaults: HttpRequestConfig;

  constructor(defaults: HttpRequestConfig = {}) {
    this.defaults = {
      timeout: 10_000,
      retry: 0,
      retryDelay: 300,
      retryOn: [408, 429, 500, 502, 503, 504],
      responseType: 'json',
      ...defaults,
    };
  }

  // ── Interceptors ─────────────────────────────────────────────────────────

  useRequest(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => { this.requestInterceptors = this.requestInterceptors.filter(i => i !== interceptor); };
  }

  useResponse<T = unknown>(interceptor: ResponseInterceptor<T>): () => void {
    this.responseInterceptors.push(interceptor as ResponseInterceptor);
    return () => { this.responseInterceptors = this.responseInterceptors.filter(i => i !== interceptor); };
  }

  useError(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => { this.errorInterceptors = this.errorInterceptors.filter(i => i !== interceptor); };
  }

  // ── Cache & Invalidation control ──────────────────────────────────────────

  clearCache(key?: string): void {
    key ? this.cache.delete(key) : this.cache.clear();
  }

  invalidateQuery(key: string): void {
    this.cache.delete(key);
  }

  // ── Core request ─────────────────────────────────────────────────────────

  async request<T = unknown>(
    method: HttpMethod,
    url: string,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    const merged = { ...this.defaults, ...config };
    const baseUrl = merged.baseUrl ?? '';
    const fullUrl = buildUrl(`${baseUrl}${url}`, merged.params);

    let finalConfig = { ...merged, url: fullUrl, method } as HttpRequestConfig & { url: string; method: HttpMethod };

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const dedupeKey = finalConfig.cacheKey ? `${method}:${finalConfig.cacheKey}` : `${method}:${fullUrl}`;

    // Request Deduplication: if an identical request is in flight, await its promise
    if (method === 'GET' && this.inFlightPromises.has(dedupeKey)) {
      return this.inFlightPromises.get(dedupeKey) as Promise<HttpResponse<T>>;
    }

    // Cache hit & Stale-While-Revalidate evaluation
    if (method === 'GET' && finalConfig.cacheKey) {
      const { data, isStale } = this.cache.get<T>(finalConfig.cacheKey);
      if (data !== null && !isStale) {
        return {
          data,
          status: 200,
          statusText: 'OK (cached)',
          headers: new Headers(),
          config: finalConfig,
        };
      }
    }

    // Execute network fetch
    const fetchPromise = (async () => {
      const maxAttempts = 1 + (finalConfig.retry ?? 0);
      const retryOn      = finalConfig.retryOn ?? [408, 429, 500, 502, 503, 504];
      const retryDelay   = finalConfig.retryDelay ?? 300;
      let lastError: HttpError | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) await sleep(retryDelay * attempt);

        try {
          const response = await this._fetch<T>(finalConfig);

          let result = response;
          for (const interceptor of this.responseInterceptors) {
            result = (await interceptor(result)) as HttpResponse<T>;
          }

          if (method === 'GET' && finalConfig.cacheKey) {
            this.cache.set(finalConfig.cacheKey, result.data, finalConfig.cacheTtl, finalConfig.staleTime);
          }

          return result;

        } catch (err) {
          const httpErr = err instanceof HttpError ? err : new HttpError(
            String(err),
            null,
            null,
            finalConfig
          );

          const shouldRetry =
            attempt < maxAttempts - 1 &&
            (httpErr.isNetworkError || (httpErr.status !== null && retryOn.includes(httpErr.status)));

          if (!shouldRetry) {
            let thrownError: HttpError = httpErr;
            for (const interceptor of this.errorInterceptors) {
              const result = await interceptor(thrownError);
              if (!(result instanceof HttpError)) {
                return result as HttpResponse<T>;
              }
              thrownError = result;
            }
            throw thrownError;
          }

          lastError = httpErr;
        }
      }

      throw lastError!;
    })();

    if (method === 'GET') {
      this.inFlightPromises.set(dedupeKey, fetchPromise);
      try {
        const res = await fetchPromise;
        return res;
      } finally {
        this.inFlightPromises.delete(dedupeKey);
      }
    }

    return fetchPromise;
  }

  private async _fetch<T>(
    config: HttpRequestConfig & { url: string; method: HttpMethod }
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const externalSignal = config.signal;

    externalSignal?.addEventListener('abort', () => controller.abort(externalSignal.reason));

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (config.timeout && config.timeout > 0) {
      timeoutId = setTimeout(() => controller.abort('timeout'), config.timeout);
    }

    const headers = new Headers({ 'Content-Type': 'application/json', ...config.headers });

    const init: RequestInit = {
      method: config.method,
      headers,
      signal: controller.signal,
    };

    if (config.body !== undefined && !['GET', 'HEAD'].includes(config.method)) {
      init.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(config.url, init);

      const responseType = config.responseType ?? 'json';
      let data: T;
      if (responseType === 'json') {
        const text = await res.text();
        data = text ? JSON.parse(text) : null as T;
      } else if (responseType === 'text') {
        data = await res.text() as T;
      } else if (responseType === 'blob') {
        data = await res.blob() as T;
      } else if (responseType === 'arrayBuffer') {
        data = await res.arrayBuffer() as T;
      } else {
        data = null as T;
      }

      const httpResponse: HttpResponse<T> = {
        data,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        config,
      };

      if (!res.ok) {
        throw new HttpError(
          `HTTP ${res.status}: ${res.statusText}`,
          res.status,
          httpResponse as HttpResponse<unknown>,
          config
        );
      }

      return httpResponse;

    } catch (err: unknown) {
      if (err instanceof HttpError) throw err;

      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const reason  = (controller.signal as any).reason;
      const message = reason === 'timeout'
        ? `Request timeout after ${config.timeout}ms`
        : isAbort
          ? 'Request aborted'
          : String(err);

      throw new HttpError(message, null, null, config);
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  }

  get<T = unknown>(url: string, config?: HttpRequestConfig)                           { return this.request<T>('GET',    url, config); }
  post<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig)          { return this.request<T>('POST',   url, { ...config, body }); }
  put<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig)           { return this.request<T>('PUT',    url, { ...config, body }); }
  patch<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig)         { return this.request<T>('PATCH',  url, { ...config, body }); }
  delete<T = unknown>(url: string, config?: HttpRequestConfig)                        { return this.request<T>('DELETE', url, config); }
  head(url: string, config?: HttpRequestConfig)                                       { return this.request('HEAD',   url, config); }

  create(overrides: HttpRequestConfig = {}): NovaHttpClient {
    const child = new NovaHttpClient({ ...this.defaults, ...overrides });
    child.requestInterceptors  = [...this.requestInterceptors];
    child.responseInterceptors = [...this.responseInterceptors];
    child.errorInterceptors    = [...this.errorInterceptors];
    return child;
  }
}

// ─── Reactive resource (signal-based Smart Query hook) ─────────────────────────

export interface UseHttpOptions<T> extends HttpRequestConfig {
  /** Run immediately on creation (default: true) */
  immediate?: boolean;
  /** Transform the response data */
  transform?: (data: unknown) => T;
  /** Initial value before the first response */
  initialData?: T;
  /** If true and cache exists but is stale, return cached data immediately while background refetching (default: true) */
  staleWhileRevalidate?: boolean;
}

export interface UseHttpResult<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<HttpError | null>;
  status: Signal<number | null>;
  isReady: ReturnType<typeof computed<boolean>>;
  execute: (overrides?: HttpRequestConfig) => Promise<void>;
  abort: () => void;
}

export function useHttp<T = unknown>(
  client: NovaHttpClient,
  method: HttpMethod,
  url: string,
  options: UseHttpOptions<T> = {}
): UseHttpResult<T> {
  const { immediate = true, transform, initialData, staleWhileRevalidate = true, ...reqConfig } = options;

  let initialVal: T | null = (initialData !== undefined ? initialData : null) as T | null;

  // Stale-While-Revalidate: instant initial cache check
  if (method === 'GET' && reqConfig.cacheKey) {
    const { data: cachedData } = client.cache.get<T>(reqConfig.cacheKey);
    if (cachedData !== null) {
      initialVal = cachedData as T | null;
    }
  }

  const data    = signal<T | null>(initialVal as any);
  const loading = signal<boolean>(false);
  const error   = signal<HttpError | null>(null);
  const status  = signal<number | null>(null);
  const isReady = computed<boolean>(() => !loading.value && data.value !== null && error.value === null);

  let controller: AbortController | null = null;
  let unsubscribeCache: (() => void) | null = null;

  // Subscribe to background cache invalidation or refetches
  if (method === 'GET' && reqConfig.cacheKey) {
    unsubscribeCache = client.cache.subscribe<T>(reqConfig.cacheKey, (newData) => {
      if (newData !== null) {
        data.value = transform ? transform(newData) : newData;
        error.value = null;
      } else {
        // Query invalidated — refetch automatically
        execute();
      }
    });
  }

  const abort = () => {
    controller?.abort();
    controller = null;
  };

  const execute = async (overrides: HttpRequestConfig = {}): Promise<void> => {
    abort();

    controller = new AbortController();
    loading.value = true;
    error.value   = null;

    try {
      const res = await client.request<T>(method, url, {
        ...reqConfig,
        ...overrides,
        signal: controller.signal,
      });

      status.value = res.status;
      data.value   = transform ? transform(res.data) : res.data;
    } catch (err) {
      if (err instanceof HttpError && err.isAborted) return;
      error.value  = err instanceof HttpError ? err : new HttpError(String(err), null, null, { url, method });
      status.value = err instanceof HttpError ? err.status : null;
    } finally {
      loading.value = false;
    }
  };

  if (immediate) {
    // If SWR initial data was populated, background refetch without blocking UI
    if (data.value !== null && staleWhileRevalidate) {
      Promise.resolve().then(() => execute());
    } else {
      Promise.resolve().then(() => execute());
    }
  }

  return { data, loading, error, status, isReady, execute, abort };
}

export const http = new NovaHttpClient();

export function createHttpClient(defaults: HttpRequestConfig = {}): NovaHttpClient {
  return new NovaHttpClient(defaults);
}

// ─── Shortcut hooks (no need to pass client or method manually) ───────────────

/**
 * `useGet` — Reactive GET request bound to the global `http` client.
 *
 * @example
 * const { data, loading, error } = useGet<User[]>('/api/users', {
 *   cacheKey: 'users',
 *   cacheTtl: 60_000,
 * });
 */
export function useGet<T = unknown>(url: string, options: UseHttpOptions<T> = {}): UseHttpResult<T> {
  return useHttp<T>(http, 'GET', url, options);
}

/**
 * `usePost` — Reactive POST request bound to the global `http` client.
 *
 * @example
 * const { execute: createUser, loading } = usePost<User>('/api/users', {
 *   immediate: false,
 * });
 * // Later: await createUser({ body: { name: 'Nova' } });
 */
export function usePost<T = unknown>(url: string, options: UseHttpOptions<T> = {}): UseHttpResult<T> {
  return useHttp<T>(http, 'POST', url, { immediate: false, ...options });
}

/**
 * `usePut` — Reactive PUT request bound to the global `http` client.
 */
export function usePut<T = unknown>(url: string, options: UseHttpOptions<T> = {}): UseHttpResult<T> {
  return useHttp<T>(http, 'PUT', url, { immediate: false, ...options });
}

/**
 * `usePatch` — Reactive PATCH request bound to the global `http` client.
 */
export function usePatch<T = unknown>(url: string, options: UseHttpOptions<T> = {}): UseHttpResult<T> {
  return useHttp<T>(http, 'PATCH', url, { immediate: false, ...options });
}

/**
 * `useDelete` — Reactive DELETE request bound to the global `http` client.
 */
export function useDelete<T = unknown>(url: string, options: UseHttpOptions<T> = {}): UseHttpResult<T> {
  return useHttp<T>(http, 'DELETE', url, { immediate: false, ...options });
}

export type { Signal } from '@nova/signals';
