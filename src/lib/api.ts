'use client';

import axios, { type AxiosError } from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
// Root origin of the backend (no `/api/v1` prefix) — Better Auth's own
// routes live at `${API_ORIGIN}/auth/*`, alongside but outside the REST API.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Auth is a single Better Auth session cookie — no Authorization header
  // to attach, so every request just needs to carry cookies.
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = (error.config?.url as string) || '';

    // A 401 here means the session cookie is missing/expired — Better Auth
    // manages its own rolling refresh server-side, so unlike the old JWT
    // setup there's nothing to retry; just bounce to /login.
    if (status === 401 && !url.includes('/auth/')) {
      const { useAuthStore } = await import('./auth-store');
      useAuthStore.getState().clear();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);


/** Unwraps the backend's { success, data } envelope. */
export function unwrap<T>(res: { data: any }): T {
  return (res.data?.data ?? res.data) as T;
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    // No message body at all (network error, non-JSON 403 from a proxy,
    // etc.) — still give a clear, permission-specific fallback rather than
    // the generic one, since a bare 403 always means the same thing.
    if (err.response?.status === 403) return "You don't have permission to do this";
  }
  // Better Auth calls (login, forgot/reset password, etc.) throw plain Errors.
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
