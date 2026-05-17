import { computed } from '@nova/signals';
import type { Signal } from '@nova/signals';
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
    config: HttpRequestConfig & {
        url: string;
        method: HttpMethod;
    };
}
export type RequestInterceptor = (config: HttpRequestConfig & {
    url: string;
    method: HttpMethod;
}) => (HttpRequestConfig & {
    url: string;
    method: HttpMethod;
}) | Promise<HttpRequestConfig & {
    url: string;
    method: HttpMethod;
}>;
export type ResponseInterceptor<T = unknown> = (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
export type ErrorInterceptor = (error: HttpError) => HttpError | Promise<HttpError | HttpResponse<unknown>>;
export declare class HttpError extends Error {
    readonly status: number | null;
    readonly response: HttpResponse<unknown> | null;
    readonly config: HttpRequestConfig & {
        url: string;
        method: HttpMethod;
    };
    constructor(message: string, status: number | null, response: HttpResponse<unknown> | null, config: HttpRequestConfig & {
        url: string;
        method: HttpMethod;
    });
    get isNetworkError(): boolean;
    get isTimeout(): boolean;
    get isAborted(): boolean;
    get isClientError(): boolean;
    get isServerError(): boolean;
}
export declare class NovaHttpClient {
    private requestInterceptors;
    private responseInterceptors;
    private errorInterceptors;
    private cache;
    private defaults;
    constructor(defaults?: HttpRequestConfig);
    /** Add a request interceptor. Returns an unregister function. */
    useRequest(interceptor: RequestInterceptor): () => void;
    /** Add a response interceptor. Returns an unregister function. */
    useResponse<T = unknown>(interceptor: ResponseInterceptor<T>): () => void;
    /** Add an error interceptor. Returns an unregister function. */
    useError(interceptor: ErrorInterceptor): () => void;
    clearCache(key?: string): void;
    request<T = unknown>(method: HttpMethod, url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /** Internal fetch execution with timeout + AbortController */
    private _fetch;
    get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    post<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    put<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    patch<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    head(url: string, config?: HttpRequestConfig): Promise<HttpResponse<unknown>>;
    /** Create a child client that inherits interceptors + defaults */
    create(overrides?: HttpRequestConfig): NovaHttpClient;
}
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
export declare function useHttp<T = unknown>(client: NovaHttpClient, method: HttpMethod, url: string, options?: UseHttpOptions<T>): UseHttpResult<T>;
/**
 * Default global client — use `http.create()` to derive scoped clients
 * (e.g., one per API domain or auth context).
 */
export declare const http: NovaHttpClient;
/**
 * Create a new client with custom defaults.
 *
 * @example
 * const api = createHttpClient({ baseUrl: 'https://api.example.com', timeout: 5000 });
 * api.useRequest(cfg => { cfg.headers!['Authorization'] = `Bearer ${token}`; return cfg; });
 */
export declare function createHttpClient(defaults?: HttpRequestConfig): NovaHttpClient;
export type { Signal } from '@nova/signals';
//# sourceMappingURL=index.d.ts.map