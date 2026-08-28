'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Users as UsersIcon, Trash2, UserPlus, KeyRound, ShieldOff, ShieldCheck } from 'lucide-react';
import { listUsers, updateUserAdmin, deleteUser, revokeAccount, activateAccount } from '@/lib/services/users';
import type { AdminUserRow, Role } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateStaffAccountModal } from '@/components/users/CreateStaffAccountModal';
import { SetPasswordModal } from '@/components/users/SetPasswordModal';
import { formatDate, initials } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'USER'];
const ROLE_TONE: Record<Role, 'violet' | 'blue' | 'green' | 'slate' | 'amber'> = {
  SUPER_ADMIN: 'violet',
  ADMIN: 'blue',
  EDITOR: 'green',
  AUTHOR: 'amber',
  USER: 'slate',
};

/**
 * AUTHOR is one access level covering two different kinds of accounts — a
 * blog contributor and/or an approved employer/recruiter. There's no
 * separate role for that; it's derived from what the account actually has
 * (posts vs. posted jobs), purely for display.
 */
function authorKind(u: AdminUserRow): string | null {
  if (u.role !== 'AUTHOR') return null;
  const hasPosts = (u._count?.posts ?? 0) > 0;
  const hasJobs = (u._count?.postedJobs ?? 0) > 0;
  if (hasPosts && hasJobs) return 'Contributor + Employer';
  if (hasJobs) return 'Employer';
  if (hasPosts) return 'Content contributor';
  return null;
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<AdminUserRow | null>(null);
  const [toRevoke, setToRevoke] = useState<AdminUserRow | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, limit: 15, search: search || undefined, role: role || undefined });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, role]);

  async function handleRoleChange(user: AdminUserRow, newRole: Role) {
    setBusyId(user.id);
    try {
      await updateUserAdmin(user.id, { role: newRole });
      toast.success(`Role updated to ${newRole.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update role'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(user: AdminUserRow) {
    // Deactivating is treated as "revoke" and needs confirmation since it force-logs-out the user.
    if (user.isActive) {
      setToRevoke(user);
      return;
    }
    setBusyId(user.id);
    try {
      await activateAccount(user.id);
      toast.success('Account reactivated');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to activate account'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke() {
    if (!toRevoke) return;
    setRevoking(true);
    try {
      await revokeAccount(toRevoke.id);
      toast.success(`${toRevoke.username}'s access was revoked`);
      setToRevoke(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to revoke account'));
    } finally {
      setRevoking(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteUser(toDelete.id);
      toast.success('User deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete user'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search name, email, username…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role | '')} className="sm:w-44">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Create staff account
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading users…" />
        ) : items.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Last login</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                          {initials(u.name || u.username)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{u.name}</p>
                          <p className="truncate text-[11.5px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Select
                        value={u.role}
                        disabled={busyId === u.id || u.id === currentUser?.id || !isSuperAdmin}
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                        className="h-8 w-36 text-[12.5px]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace('_', ' ')}
                          </option>
                        ))}
                      </Select>
                      {authorKind(u) && (
                        <p className="mt-1 text-[11px] text-slate-400">{authorKind(u)}</p>
                      )}
                    </Td>
                    <Td>
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busyId === u.id || u.id === currentUser?.id || !isSuperAdmin}
                      >
                        <Badge tone={u.isActive ? 'green' : 'red'} dot>
                          {u.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                      </button>
                    </Td>
                    <Td>{formatDate(u.createdAt)}</Td>
                    <Td>{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {isSuperAdmin && u.id !== currentUser?.id && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Set password"
                              onClick={() => setPasswordTarget(u)}
                            >
                              <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title={u.isActive ? 'Revoke access' : 'Reactivate account'}
                              onClick={() => handleToggleActive(u)}
                              disabled={busyId === u.id}
                            >
                              {u.isActive ? (
                                <ShieldOff className="h-3.5 w-3.5 text-amber-600" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                            </Button>
                            <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(u)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={15} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${toDelete?.name}"?`}
        description="This permanently removes the user account."
      />

      <ConfirmDialog
        open={!!toRevoke}
        onClose={() => setToRevoke(null)}
        onConfirm={handleRevoke}
        loading={revoking}
        danger
        confirmLabel="Revoke access"
        title={`Revoke access for "${toRevoke?.name}"?`}
        description="They'll be logged out immediately and won't be able to sign back in until reactivated."
      />

      <CreateStaffAccountModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      <SetPasswordModal user={passwordTarget} onClose={() => setPasswordTarget(null)} />
    </div>
  );
}
