import { createAuthClient } from 'better-auth/react';
import { API_ORIGIN } from '@/lib/api';

// The admin console talks to its OWN Better Auth instance, mounted at
// `/admin-auth/*` — separate from the `/auth/*` instance the public site
// uses. This is deliberate: the two instances issue differently-named
// session cookies (`admin_session` vs Better Auth's default), so signing
// in here never overwrites/ends a reader session on the public site in
// the same browser, and vice versa. See the backend's
// src/auth/better-auth.ts for the full rationale. Both instances share
// the same underlying accounts — this only affects which cookie a
// browser holds, not who's allowed to have one.
export const authClient = createAuthClient({
  baseURL: `${API_ORIGIN}/admin-auth`,
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
