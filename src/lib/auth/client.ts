import { createAuthClient } from 'better-auth/react';
import { API_ORIGIN } from '@/lib/api';

// Better Auth is mounted at `/auth/*` on the backend, OUTSIDE the `/api/v1`
// prefix used by the rest of the admin API (see basePath in the backend's
// src/auth/better-auth.ts and the exclude rule in main.ts).
export const authClient = createAuthClient({
  baseURL: `${API_ORIGIN}/auth`,
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signOut, forgetPassword, resetPassword, changePassword } = authClient;

/** Shape of `session.user`, including the additionalFields declared on the backend. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  image?: string | null;
  bio?: string | null;
  isActive?: boolean;
  emailVerified: boolean;
}
