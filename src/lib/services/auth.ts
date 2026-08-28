import { api, unwrap } from '../api';
import type { AuthUser, CurrentUser } from '../types';

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return unwrap<LoginResponse>(res);
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore — we're clearing local session regardless
  }
}

export async function fetchMe() {
  const res = await api.get('/auth/me');
  return unwrap<CurrentUser>(res);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await api.post('/auth/change-password', { currentPassword, newPassword });
  return unwrap<{ message: string }>(res);
}
