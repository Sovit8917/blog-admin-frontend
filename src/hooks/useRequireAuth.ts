'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isStaff } from '@/lib/auth-store';
import { fetchMe } from '@/lib/services/auth';

/**
 * Guards a page/layout: confirms the session (via /auth/me, using the httpOnly refresh
 * cookie if the in-memory access token is gone) and redirects to /login if unauthenticated
 * or not a staff role.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, accessToken, updateUser, clear } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!accessToken) {
        if (!cancelled) {
          clear();
          router.replace('/login');
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (!isStaff(me.role)) {
          clear();
          router.replace('/login?error=forbidden');
          return;
        }
        const current = useAuthStore.getState().user;
        if (current) updateUser({ ...current, ...me });
      } catch {
        if (!cancelled) {
          clear();
          router.replace('/login');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, checking };
}
