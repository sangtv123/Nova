/**
 * api.ts — Scoped HTTP client cho my-app
 *
 * Tất cả các service đều import `api` từ đây thay vì
 * tạo client mới, để dùng chung interceptors.
 */
import { createHttpClient, HttpError } from '@nova/http';

// ── 1. Tạo client với base config ─────────────────────────────────────────────
export const api = createHttpClient({
  baseUrl: 'https://jsonplaceholder.typicode.com', // demo API công khai
  timeout: 10_000,
  retry: 2,
  retryDelay: 400,
  retryOn: [429, 500, 502, 503, 504],
});

// ── 2. Auth interceptor — gắn token vào mọi request ──────────────────────────
api.useRequest(cfg => {
  const token = localStorage.getItem('nova_token');
  if (token) {
    cfg.headers ??= {};
    cfg.headers['Authorization'] = `Bearer ${token}`;
  }
  return cfg;
});

// ── 3. Response logger (dev only) ─────────────────────────────────────────────
if (import.meta.env?.DEV) {
  api.useResponse(res => {
    console.debug(`[HTTP] ${res.config.method} ${res.config.url} → ${res.status}`);
    return res;
  });
}

// ── 4. Global error handler — 401 → logout, 5xx → toast ──────────────────────
api.useError(err => {
  if (err instanceof HttpError) {
    if (err.status === 401) {
      localStorage.removeItem('nova_token');
      // Redirect về login (không reload hẳn, dùng router)
      window.dispatchEvent(new CustomEvent('nova:unauthorized'));
    }
    if (err.isServerError) {
      window.dispatchEvent(
        new CustomEvent('nova:toast', { detail: { message: 'Server error, please try again.', type: 'error' } })
      );
    }
  }
  return err; // ném tiếp để component tự xử lý nếu cần
});
