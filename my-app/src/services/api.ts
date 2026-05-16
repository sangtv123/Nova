/**
 * api.ts — Scoped HTTP client for my-app
 *
 * All services import `api` from here instead of
 * creating a new client, to share interceptors.
 */
import { createHttpClient, HttpError } from '@nova/http';

// ── 1. Create client with base config ─────────────────────────────────────────────
export const api = createHttpClient({
  baseUrl: 'https://jsonplaceholder.typicode.com', // public demo API
  timeout: 10_000,
  retry: 2,
  retryDelay: 400,
  retryOn: [429, 500, 502, 503, 504],
});

// ── 2. Auth interceptor — attach token to every request ──────────────────────────
api.useRequest((cfg: any) => {
  const token = localStorage.getItem('nova_token');
  if (token) {
    cfg.headers ??= {};
    cfg.headers['Authorization'] = `Bearer ${token}`;
  }
  return cfg;
});

// ── 3. Response logger (dev only) ─────────────────────────────────────────────
if ((import.meta as any).env?.DEV) {
  api.useResponse((res: any) => {
    console.debug(`[HTTP] ${res.config.method} ${res.config.url} → ${res.status}`);
    return res;
  });
}

// ── 4. Global error handler — 401 → logout, 5xx → toast ──────────────────────
api.useError((err: any) => {
  if (err instanceof HttpError) {
    if (err.status === 401) {
      localStorage.removeItem('nova_token');
      // Redirect to login (without full reload, using router)
      window.dispatchEvent(new CustomEvent('nova:unauthorized'));
    }
    if (err.isServerError) {
      window.dispatchEvent(
        new CustomEvent('nova:toast', { detail: { message: 'Server error, please try again.', type: 'error' } })
      );
    }
  }
  return err; // throw further for components to handle if needed
});
