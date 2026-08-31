'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Save,
  ShieldCheck,
  RotateCcw,
  Search,
  Check,
  Lock,
} from 'lucide-react';
import {
  fetchPermissionMatrix,
  updatePermissions,
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionEntry,
  type PermissionMatrix,
} from '@/lib/services/permissions';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Role } from '@/lib/types';

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

const ROLE_TONES: Record<string, 'blue' | 'green' | 'slate'> = {
  ADMIN: 'blue',
  EDITOR: 'green',
  AUTHOR: 'slate',
};

function key(role: string, resource: string, action: string) {
  return `${role}::${resource}::${action}`;
}

export default function PermissionsPage() {
  const currentRole = useAuthStore((s) => s.user?.role);
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | 'ALL'>('ALL');

  const [edits, setEdits] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (currentRole && currentRole !== 'SUPER_ADMIN') {
      setLoading(false);
      return;
    }
    fetchPermissionMatrix()
      .then(setMatrix)
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load permissions')))
      .finally(() => setLoading(false));
  }, [currentRole]);

  const allowedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    matrix?.items.forEach((item) => map.set(key(item.role, item.resource, item.action), item.allowed));
    return map;
  }, [matrix]);

  function isAllowed(role: string, resource: string, action: string) {
    const k = key(role, resource, action);
    return edits.has(k) ? edits.get(k)! : allowedMap.get(k) ?? true;
  }

  function toggle(role: string, resource: string, action: string) {
    const k = key(role, resource, action);
    const current = isAllowed(role, resource, action);
    setEdits((prev) => new Map(prev).set(k, !current));
  }

  function toggleAllForRole(role: string, enable: boolean) {
    if (!matrix) return;
    const newEdits = new Map(edits);
    matrix.resources.forEach((res) => {
      PERMISSION_ACTIONS.forEach((action) => {
        const k = key(role, res.key, action);
        newEdits.set(k, enable);
      });
    });
    setEdits(newEdits);
  }

  function resetChanges() {
    setEdits(new Map());
  }

  async function save() {
    if (!matrix || edits.size === 0) return;
    setSaving(true);
    try {
      const items: PermissionEntry[] = Array.from(edits.entries()).map(([k, allowed]) => {
        const [role, resource, action] = k.split('::');
        return { role: role as Role, resource, action: action as PermissionAction, allowed };
      });
      const updated = await updatePermissions(items);
      setMatrix(updated);
      setEdits(new Map());
      toast.success('Permissions updated successfully');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save permissions'));
    } finally {
      setSaving(false);
    }
  }

  const filteredResources = useMemo(() => {
    if (!matrix) return [];
    if (!searchQuery.trim()) return matrix.resources;
    const q = searchQuery.toLowerCase();
    return matrix.resources.filter((r) => r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
  }, [matrix, searchQuery]);

  const activeRoles = useMemo(() => {
    if (!matrix) return [];
    if (selectedRole === 'ALL') return matrix.roles;
    return matrix.roles.filter((r) => r === selectedRole);
  }, [matrix, selectedRole]);

  if (currentRole && currentRole !== 'SUPER_ADMIN') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Super Admin access required"
        description="Only a Super Admin can view or configure the staff permission matrix."
      />
    );
  }

  if (loading) return <PageSpinner label="Loading permissions…" />;
  if (!matrix) return null;

  return (
    <div className="space-y-5">
      {/* Top Header & Save Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Permissions</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage access rights and staff capabilities across admin dashboard pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {edits.size > 0 && (
            <Button variant="outline" size="sm" onClick={resetChanges}>
              <RotateCcw className="h-3.5 w-3.5" /> Discard {edits.size} change{edits.size === 1 ? '' : 's'}
            </Button>
          )}
          <Button size="sm" onClick={save} loading={saving} disabled={edits.size === 0}>
            <Save className="h-3.5 w-3.5" /> Save changes
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader
          title="Permission matrix"
          description="Control exactly which staff role can view, create, update, or delete on each page. Turning off 'View' hides the page entirely and blocks its API too. Super Admin always has full access."
          action={
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          }
        />

        {/* Role Filter Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Filter Role:</span>
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                selectedRole === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              All Roles
            </button>
            {matrix.roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedRole === role
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            {filteredResources.length} {filteredResources.length === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[1000px] border-collapse text-[13px]">
            <thead>
              {/* Roles Header */}
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="sticky left-0 z-10 bg-slate-50/95 px-5 py-3 text-left font-semibold text-slate-700 shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                  Page
                </th>
                {activeRoles.map((role) => (
                  <th
                    key={role}
                    colSpan={PERMISSION_ACTIONS.length}
                    className="border-l border-slate-200 px-4 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone={ROLE_TONES[role] || 'slate'}>{role.replace('_', ' ')}</Badge>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => toggleAllForRole(role, true)}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          Select all
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => toggleAllForRole(role, false)}
                          className="font-medium text-slate-500 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>

              {/* Actions Subheader */}
              <tr className="border-b border-slate-200 bg-white">
                <th className="sticky left-0 z-10 bg-white px-5 py-2 shadow-[1px_0_0_0_rgba(226,232,240,1)]"></th>
                {activeRoles.map((role) =>
                  PERMISSION_ACTIONS.map((action, ai) => (
                    <th
                      key={`${role}-${action}`}
                      className={`px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${
                        ai === 0 ? 'border-l border-slate-200' : ''
                      }`}
                    >
                      {ACTION_LABELS[action]}
                    </th>
                  )),
                )}
              </tr>
            </thead>

            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-5 py-3 font-medium text-slate-800 shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                    {resource.label}
                  </td>
                  {activeRoles.map((role) =>
                    PERMISSION_ACTIONS.map((action, ai) => {
                      const allowed = isAllowed(role, resource.key, action);
                      const dirty = edits.has(key(role, resource.key, action));
                      const pageHidden = action !== 'view' && !isAllowed(role, resource.key, 'view');

                      return (
                        <td
                          key={`${role}-${action}`}
                          className={`px-4 py-3 text-center ${ai === 0 ? 'border-l border-slate-200' : ''} ${
                            dirty ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <label
                            className={`inline-flex items-center justify-center gap-1.5 ${
                              pageHidden ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                            }`}
                            title={
                              pageHidden
                                ? "View is off for this role — this page is unreachable regardless of this setting"
                                : undefined
                            }
                          >
                            <input
                              type="checkbox"
                              checked={allowed}
                              disabled={pageHidden}
                              onChange={() => toggle(role, resource.key, action)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
                            />
                            {dirty && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Unsaved change" />
                            )}
                          </label>
                        </td>
                      );
                    }),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}


