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
  /** Cache key — if set, response is cached in-memory */
  cacheKey?: string;
  /** Cache TTL in milliseconds (default: 0 = no expiry) */
  cacheTtl?: number;
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

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // 0 = never expires
}

class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl = 0): void {
    this.store.set(key, {
      data,
      expiresAt: ttl > 0 ? Date.now() + ttl : 0,
    });
  }

  delete(key: string): void { this.store.delete(key); }
  clear(): void             { this.store.clear(); }

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
  // Return full URL or just path+search depending on whether it's absolute
  return base.startsWith('http') ? url.toString() : url.pathname + url.search;
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ─── Nova HTTP Client ─────────────────────────────────────────────────────────

export class NovaHttpClient {
  private requestInterceptors: RequestInterceptor[]  = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[]       = [];
  private cache = new ResponseCache();
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

  /** Add a request interceptor. Returns an unregister function. */
  useRequest(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => { this.requestInterceptors = this.requestInterceptors.filter(i => i !== interceptor); };
  }

  /** Add a response interceptor. Returns an unregister function. */
  useResponse<T = unknown>(interceptor: ResponseInterceptor<T>): () => void {
    this.responseInterceptors.push(interceptor as ResponseInterceptor);
    return () => { this.responseInterceptors = this.responseInterceptors.filter(i => i !== interceptor); };
  }

  /** Add an error interceptor. Returns an unregister function. */
  useError(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => { this.errorInterceptors = this.errorInterceptors.filter(i => i !== interceptor); };
  }

  // ── Cache control ─────────────────────────────────────────────────────────

  clearCache(key?: string): void {
    key ? this.cache.delete(key) : this.cache.clear();
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

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // Cache hit (GET-only)
    if (method === 'GET' && finalConfig.cacheKey) {
      const cached = this.cache.get<T>(finalConfig.cacheKey);
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
    const retryOn      = finalConfig.retryOn ?? [408, 429, 500, 502, 503, 504];
    const retryDelay   = finalConfig.retryDelay ?? 300;
    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await sleep(retryDelay * attempt); // exponential-ish backoff

      try {
        const response = await this._fetch<T>(finalConfig);

        // Run response interceptors
        let result = response;
        for (const interceptor of this.responseInterceptors) {
          result = (await interceptor(result)) as HttpResponse<T>;
        }

        // Cache successful GET
        if (method === 'GET' && finalConfig.cacheKey) {
          this.cache.set(finalConfig.cacheKey, result.data, finalConfig.cacheTtl);
        }

        return result;

      } catch (err) {
        const httpErr = err instanceof HttpError ? err : new HttpError(
          String(err),
          null,
          null,
          finalConfig
        );

        // Should retry?
        const shouldRetry =
          attempt < maxAttempts - 1 &&
          (httpErr.isNetworkError || (httpErr.status !== null && retryOn.includes(httpErr.status)));

        if (!shouldRetry) {
          // Run error interceptors
          let thrownError: HttpError = httpErr;
          for (const interceptor of this.errorInterceptors) {
            const result = await interceptor(thrownError);
            if (!(result instanceof HttpError)) {
              // Interceptor recovered — return as success
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
  }

  /** Internal fetch execution with timeout + AbortController */
  private async _fetch<T>(
    config: HttpRequestConfig & { url: string; method: HttpMethod }
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const externalSignal = config.signal;

    // Forward external abort signal
    externalSignal?.addEventListener('abort', () => controller.abort(externalSignal.reason));

    // Timeout
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

      // Parse body
      const responseType = config.responseType ?? 'json';
      let data: T;
      if (responseType === 'json') {
        // Safely parse — some 204 No Content responses have no body
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

  // ── Shorthand methods ─────────────────────────────────────────────────────

  get<T = unknown>(url: string, config?: HttpRequestConfig)                           { return this.request<T>('GET',    url, config); }
  post<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig)          { return this.request<T>('POST',   url, { ...config, body }); }
  put<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig)           { return this.request<T>('PUT',    url, { ...config, body }); }
  patch<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig)         { return this.request<T>('PATCH',  url, { ...config, body }); }
  delete<T = unknown>(url: string, config?: HttpRequestConfig)                        { return this.request<T>('DELETE', url, config); }
  head(url: string, config?: HttpRequestConfig)                                       { return this.request('HEAD',   url, config); }

  /** Create a child client that inherits interceptors + defaults */
  create(overrides: HttpRequestConfig = {}): NovaHttpClient {
    const child = new NovaHttpClient({ ...this.defaults, ...overrides });
    child.requestInterceptors  = [...this.requestInterceptors];
    child.responseInterceptors = [...this.responseInterceptors];
    child.errorInterceptors    = [...this.errorInterceptors];
    return child;
  }
}

// ─── Reactive resource (signal-based) ─────────────────────────────────────────

export interface UseHttpOptions<T> extends HttpRequestConfig {
  /** Run immediately on creation (default: true) */
  immediate?: boolean;
  /** Transform the response data */
  transform?: (data: unknown) => T;
  /** Initial value before the first response */
  initialData?: T;
}

export interface UseHttpResult<T> {
  /** Reactive signal: the response data */
  data: Signal<T | null>;
  /** Reactive signal: loading state */
  loading: Signal<boolean>;
  /** Reactive signal: last HTTP error */
  error: Signal<HttpError | null>;
  /** Reactive signal: HTTP status code */
  status: Signal<number | null>;
  /** Computed: true when data is available and not loading */
  isReady: ReturnType<typeof computed<boolean>>;
  /** Execute the request (or re-execute) */
  execute: (overrides?: HttpRequestConfig) => Promise<void>;
  /** Abort the in-flight request */
  abort: () => void;
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
export function useHttp<T = unknown>(
  client: NovaHttpClient,
  method: HttpMethod,
  url: string,
  options: UseHttpOptions<T> = {}
): UseHttpResult<T> {
  const { immediate = true, transform, initialData, ...reqConfig } = options;

  const data    = signal<T | null>(initialData ?? null);
  const loading = signal<boolean>(false);
  const error   = signal<HttpError | null>(null);
  const status  = signal<number | null>(null);
  const isReady = computed<boolean>(() => !loading.value && data.value !== null && error.value === null);

  let controller: AbortController | null = null;

  const abort = () => {
    controller?.abort();
    controller = null;
  };

  const execute = async (overrides: HttpRequestConfig = {}): Promise<void> => {
    abort(); // cancel any in-flight request

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
      if (err instanceof HttpError && err.isAborted) return; // intentional cancel
      error.value  = err instanceof HttpError ? err : new HttpError(String(err), null, null, { url, method });
      status.value = err instanceof HttpError ? err.status : null;
    } finally {
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
export function createHttpClient(defaults: HttpRequestConfig = {}): NovaHttpClient {
  return new NovaHttpClient(defaults);
}

// ─── Re-export for ergonomics ─────────────────────────────────────────────────
export type { Signal } from '@nova/signals';
