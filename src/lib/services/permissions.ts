import { api, unwrap } from '../api';
import type { Role } from '../types';

export const PERMISSION_RESOURCES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'posts', label: 'Posts' },
  { key: 'categories', label: 'Categories' },
  { key: 'tags', label: 'Tags' },
  { key: 'comments', label: 'Comments' },
  { key: 'media', label: 'Media Library' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'applications', label: 'Applications' },
  { key: 'companies', label: 'Companies' },
  { key: 'skills', label: 'Skills' },
  { key: 'developer-resources', label: 'Developer Resources' },
  { key: 'ads', label: 'Ads' },
  { key: 'affiliate-links', label: 'Affiliate Links' },
  { key: 'sponsors', label: 'Sponsors' },
  { key: 'newsletter', label: 'Newsletter' },
] as const;

// 'view' controls whether the role can open the page at all (its list/detail
// endpoints); 'create'/'update'/'delete' control the write actions within it.
// A role with view=false is denied server-side too — see PermissionsGuard.
export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** Roles the matrix actually governs — SUPER_ADMIN always has full access and is never shown here. */
export const PERMISSION_ROLES: Role[] = ['ADMIN', 'EDITOR', 'AUTHOR'];

export type EffectivePermissions = Record<string, Record<PermissionAction, boolean>>;

export interface PermissionEntry {
  role: Role;
  resource: string;
  action: PermissionAction;
  allowed: boolean;
}

export interface PermissionMatrix {
  roles: Role[];
  resources: { key: string; label: string }[];
  actions: PermissionAction[];
  items: PermissionEntry[];
}

/** Effective permissions for the CURRENTLY LOGGED IN user — used to gate buttons/nav in the UI. */
export async function fetchMyPermissions() {
  const res = await api.get('/cms/permissions/me');
  return unwrap<EffectivePermissions>(res);
}

/** Full role x resource x action matrix — Super Admin only. */
export async function fetchPermissionMatrix() {
  const res = await api.get('/cms/permissions');
  return unwrap<PermissionMatrix>(res);
}

/** Bulk-save edited matrix entries — Super Admin only. */
export async function updatePermissions(items: PermissionEntry[]) {
  const res = await api.put('/cms/permissions', { items });
  return unwrap<PermissionMatrix>(res);
}
