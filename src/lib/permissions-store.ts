'use client';

import { create } from 'zustand';
import { fetchMyPermissions, type EffectivePermissions, type PermissionAction } from './services/permissions';
import { useAuthStore } from './auth-store';

interface PermissionsState {
  permissions: EffectivePermissions | null;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  clear: () => void;
}

// Caches the logged-in user's own effective permission map (GET
// /cms/permissions/me) so Sidebar/action buttons across the app can gate
// synchronously after the first load, instead of every component fetching
// it independently. Cleared on logout alongside the auth store.
export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: null,
  loaded: false,
  loading: false,
  async load() {
    if (get().loading) return;
    set({ loading: true });
    try {
      const permissions = await fetchMyPermissions();
      set({ permissions, loaded: true, loading: false });
    } catch {
      // Fail open on the client: the backend is the real enforcement point
      // (PermissionsGuard). If this fetch fails, `can()` below defaults to
      // true rather than hiding buttons a user might actually be allowed
      // to use, and the button's own API call will 403 if not.
      set({ permissions: {}, loaded: true, loading: false });
    }
  },
  clear() {
    set({ permissions: null, loaded: false, loading: false });
  },
}));

/**
 * `can('posts', 'delete')` — true unless the logged-in user's role has been
 * explicitly restricted by a Super Admin via the Permissions matrix.
 * SUPER_ADMIN is always true. Loads permissions lazily on first use.
 */
export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role);
  const { permissions, loaded, load } = usePermissionsStore();

  if (!loaded && role) {
    // Fire-and-forget; component re-renders once the store updates.
    load();
  }

  function can(resource: string, action: PermissionAction): boolean {
    if (role === 'SUPER_ADMIN') return true;
    if (!permissions) return true; // not loaded yet — don't flash-hide buttons
    const entry = permissions[resource];
    if (!entry) return true;
    return entry[action] ?? true;
  }

  return { can, loaded };
}
