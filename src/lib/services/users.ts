import { api, unwrap } from '../api';
import type { AdminUserRow, Role, PaginatedOffset } from '../types';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role | '';
}

export async function listUsers(params: ListUsersParams) {
  const res = await api.get('/admin/users', {
    params: { ...params, role: params.role || undefined },
  });
  return unwrap<PaginatedOffset<AdminUserRow>>(res);
}

export async function updateUserAdmin(id: string, values: { role?: Role; isActive?: boolean }) {
  const res = await api.patch(`/admin/users/${id}`, values);
  return unwrap<AdminUserRow>(res);
}

export async function deleteUser(id: string) {
  const res = await api.delete(`/admin/users/${id}`);
  return unwrap<{ message: string }>(res);
}

// ---- Super Admin: staff account lifecycle ----
// Every Admin / Editor / Author (and additional Super Admin) account is
// created directly by a Super Admin, who chooses the username + initial
// password. These calls hit the SuperAdmin-only endpoints on the backend.

export interface CreateStaffAccountValues {
  email: string;
  username: string;
  name: string;
  password: string;
  role: Exclude<Role, 'USER'>;
}

export async function createStaffAccount(values: CreateStaffAccountValues) {
  const res = await api.post('/admin/staff', values);
  return unwrap<AdminUserRow>(res);
}

export async function revokeAccount(id: string) {
  const res = await api.patch(`/admin/users/${id}/revoke`);
  return unwrap<AdminUserRow>(res);
}

export async function activateAccount(id: string) {
  const res = await api.patch(`/admin/users/${id}/activate`);
  return unwrap<AdminUserRow>(res);
}

export async function setUserPassword(id: string, newPassword: string) {
  const res = await api.patch(`/admin/users/${id}/password`, { newPassword });
  return unwrap<{ message: string }>(res);
}

