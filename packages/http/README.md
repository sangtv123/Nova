# `@nova/http`

Reactive HTTP client tích hợp sâu với signal system của Nova.

## Features

| Feature | Mô tả |
|---|---|
| **Interceptors** | Request / Response / Error interceptors có thể chain |
| **Retry** | Auto-retry với exponential backoff, cấu hình status codes |
| **Cache** | In-memory LRU cache với TTL per-request |
| **Cancellation** | AbortController tích hợp, timeout tự động |
| **Reactive** | `useHttp()` trả về signals `data`, `loading`, `error`, `status` |
| **Type-safe** | Generics đầy đủ cho request body và response data |
| **Scoped clients** | `client.create()` kế thừa interceptors + override defaults |

---

## Usage

### 1. Global client (singleton)

```ts
import { http } from '@nova/http';

const res = await http.get<User[]>('/api/users');
console.log(res.data); // User[]
```

### 2. Scoped client với `baseUrl` + auth interceptor

```ts
import { createHttpClient } from '@nova/http';

const api = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 8000,
});

// Gắn Bearer token vào mọi request
api.useRequest(cfg => {
  cfg.headers ??= {};
  cfg.headers['Authorization'] = `Bearer ${getToken()}`;
  return cfg;
});

// Log mọi response
api.useResponse(res => {
  console.log(`[${res.config.method}] ${res.config.url} → ${res.status}`);
  return res;
});

// Xử lý lỗi 401 → redirect login
api.useError(err => {
  if (err.status === 401) location.href = '/login';
  return err;
});
```

### 3. Retry + Cache

```ts
const res = await api.get<Product>('/products/42', {
  retry: 3,          // thử lại tối đa 3 lần
  retryDelay: 500,   // 500ms, 1000ms, 1500ms (tăng dần)
  retryOn: [429, 503],

  cacheKey: 'product-42',
  cacheTtl: 60_000,  // cache 1 phút
});
```

### 4. `useHttp()` — Reactive signal integration

```tsx
import { useHttp, createHttpClient } from '@nova/http';

const api = createHttpClient({ baseUrl: '/api' });

function UserList() {
  const { data, loading, error, execute } = useHttp<User[]>(api, 'GET', '/users', {
    immediate: true,                    // fetch ngay khi khởi tạo
    transform: users => users.sort(...) // transform trước khi lưu vào signal
  });

  return (
    <div>
      {() => loading.value && <p>Loading...</p>}
      {() => error.value   && <p class="error">{error.value.message}</p>}
      {() => data.value?.map(u => <div>{u.name}</div>)}
      <button onClick={() => execute()}>Refresh</button>
    </div>
  );
}
```

### 5. Cancellation + Timeout

```ts
const controller = new AbortController();

// Cancel sau 2 giây nếu chưa xong
setTimeout(() => controller.abort(), 2000);

const res = await api.post('/upload', formData, {
  signal: controller.signal,
  timeout: 30_000, // 30s timeout riêng
  responseType: 'none', // không parse body
});
```

### 6. Shorthand methods

```ts
api.get<T>(url, config?)
api.post<T>(url, body?, config?)
api.put<T>(url, body?, config?)
api.patch<T>(url, body?, config?)
api.delete<T>(url, config?)
api.head(url, config?)
```

---

## API Reference

### `NovaHttpClient`

| Method | Mô tả |
|---|---|
| `request<T>(method, url, config)` | Core method |
| `get / post / put / patch / delete / head` | Shorthands |
| `useRequest(fn)` | Thêm request interceptor, trả về unregister fn |
| `useResponse(fn)` | Thêm response interceptor |
| `useError(fn)` | Thêm error interceptor (có thể recover bằng cách trả về `HttpResponse`) |
| `create(overrides)` | Tạo child client kế thừa interceptors |
| `clearCache(key?)` | Xóa cache theo key hoặc toàn bộ |

### `HttpRequestConfig`

| Field | Type | Default | Mô tả |
|---|---|---|---|
| `baseUrl` | `string` | — | Prefix cho tất cả URLs |
| `headers` | `Record<string, string>` | — | HTTP headers |
| `params` | `Record<string, ...>` | — | Query string params |
| `body` | `unknown` | — | Request body (auto JSON.stringify) |
| `timeout` | `number` | `10000` | ms trước khi abort |
| `retry` | `number` | `0` | Số lần retry |
| `retryDelay` | `number` | `300` | ms giữa các retry |
| `retryOn` | `number[]` | `[408,429,500,502,503,504]` | Status codes trigger retry |
| `signal` | `AbortSignal` | — | Manual cancellation |
| `responseType` | `'json'\|'text'\|'blob'\|'arrayBuffer'\|'none'` | `'json'` | Kiểu parse response |
| `cacheKey` | `string` | — | Key để cache response |
| `cacheTtl` | `number` | `0` | TTL cache (ms), 0 = không hết hạn |

### `HttpError`

```ts
err.status      // HTTP status code hoặc null nếu network error
err.isNetworkError
err.isTimeout
err.isAborted
err.isClientError  // 4xx
err.isServerError  // 5xx
err.response    // HttpResponse | null
err.config      // request config
```
