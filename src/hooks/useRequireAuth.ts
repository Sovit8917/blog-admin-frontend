'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isStaff } from '@/lib/auth-store';
import { fetchMe } from '@/lib/services/auth';

/**
 * Guards a page/layout: confirms the session against Better Auth's own
 * session cookie (sent automatically via axios's `withCredentials`) and
 * redirects to /login if unauthenticated or not a staff role.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, updateUser, clear } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      console.log('[useRequireAuth] verify() start');
      try {
        const me = await fetchMe();
        console.log('[useRequireAuth] fetchMe() succeeded:', me);
        if (cancelled) return;
        if (!isStaff(me.role)) {
          console.log('[useRequireAuth] role not staff, redirecting to /login?error=forbidden. role=', me.role);
          clear();
          router.replace('/login?error=forbidden');
          return;
        }
        const current = useAuthStore.getState().user;
        updateUser({ ...(current ?? {}), ...me } as typeof current & typeof me);
        console.log('[useRequireAuth] session confirmed, staying on page');
      } catch (err) {
        console.log('[useRequireAuth] fetchMe() threw, redirecting to /login. error=', err);
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