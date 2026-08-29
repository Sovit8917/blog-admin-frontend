'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  setSession: (user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  clear: () => void;
}

// Auth itself is a Better Auth session cookie (httpOnly, sent automatically
// via axios's `withCredentials`) — this store just caches the current
// user's profile for instant UI reads (Sidebar, Topbar, etc.) without
// re-deriving it from `authClient.useSession()` in every component.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (user) => set({ user }),
      updateUser: (user) => set({ user }),
      clear: () => set({ user: null }),
    }),
    { name: 'blog-admin-auth' },
  ),
);

/** Roles allowed to sign in to the admin dashboard at all. */
export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] as const;

export function isStaff(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}
