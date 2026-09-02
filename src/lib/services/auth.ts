import { authClient } from '../auth/client';
import type { AuthUser, CurrentUser } from '../types';

export interface LoginResponse {
  user: AuthUser;
}

function toAuthUser(u: Record<string, unknown>): AuthUser {
  return {
    id: u.id as string,
    email: u.email as string,
    username: u.username as string,
    name: u.name as string,
    role: u.role as AuthUser['role'],
    avatarUrl: (u.image as string | null) ?? null,
    bio: (u.bio as string | null) ?? null,
    isActive: (u.isActive as boolean) ?? true,
    isEmailVerified: (u.emailVerified as boolean) ?? false,
    createdAt: (u.createdAt as string) || new Date().toISOString(),
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data, error } = await authClient.signIn.email({ email, password });
  if (error || !data?.user) throw new Error(error?.message || 'Invalid email or password');
  return { user: toAuthUser(data.user as Record<string, unknown>) };
}

export function loginWithGoogle(redirectTo = '/') {
  return authClient.signIn.social({ provider: 'google', callbackURL: redirectTo });
}

export async function logout() {
  try {
    await authClient.signOut();
  } catch {
    // ignore — we're clearing local session regardless
  }
}

export async function fetchMe(): Promise<CurrentUser> {
  const { data, error } = await authClient.getSession();
  console.log('[fetchMe] getSession() result:', { data, error });
  if (!data?.user) throw new Error('Not authenticated');
  const u = data.user as Record<string, unknown>;
  return {
    id: u.id as string,
    email: u.email as string,
    username: u.username as string,
    role: u.role as CurrentUser['role'],
    name: u.name as string | undefined,
  };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { error } = await authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  if (error) throw new Error(error.message || 'Could not change password');
  return { message: 'Password updated' };
}

export async function forgotPassword(email: string) {
  const { error } = await (authClient as any).forgetPassword({ email, redirectTo: '/reset-password' });
  if (error) throw new Error(error.message || 'Something went wrong');
}

export async function resetPassword(newPassword: string, token: string) {
  const { error } = await authClient.resetPassword({ newPassword, token });
  if (error) throw new Error(error.message || 'This link may have expired');
}