import { createAuthClient } from 'better-auth/react';

// The admin console talks to its OWN Better Auth instance, mounted at
// `/admin-auth/*` — separate from the `/auth/*` instance the public site
// uses.
//
// The two instances issue differently-named session cookies
// (`admin_session` vs Better Auth's default), so signing in here does not
// overwrite/end a reader session on the public site in the same browser.

const getBaseURL = () => {
  // Browser:
  // Use the frontend's own origin so requests stay same-origin.
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/admin-auth`;
  }

  // Server / SSR / Vercel build:
  // window does not exist, so use the actual backend URL.
  const backendURL = process.env.BACKEND_URL;

  if (!backendURL) {
    throw new Error('BACKEND_URL is not configured');
  }

  return `${backendURL.replace(/\/$/, '')}/admin-auth`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signOut } = authClient as any;

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