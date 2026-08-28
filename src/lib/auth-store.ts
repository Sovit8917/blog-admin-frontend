'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      updateUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    { name: 'blog-admin-auth' },
  ),
);

/** Roles allowed to sign in to the admin dashboard at all. */
export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] as const;

export function isStaff(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}
