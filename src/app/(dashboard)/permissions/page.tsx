'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, ShieldCheck, RotateCcw } from 'lucide-react';
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

const ROLE_TONE: Record<string, 'violet' | 'blue' | 'green' | 'slate'> = {
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
  // Local edits layered over the loaded matrix, keyed by role::resource::action.
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
      toast.success('Permissions updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save permissions'));
    } finally {
      setSaving(false);
    }
  }

  if (currentRole && currentRole !== 'SUPER_ADMIN') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Super Admin only"
        description="Only a Super Admin can view or change the permissions matrix."
      />
    );
  }

  if (loading) return <PageSpinner label="Loading permissions…" />;
  if (!matrix) return null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Permission matrix"
          description="Control exactly which staff role can view, create, update, or delete on each page. Turning off 'View' hides the page entirely and blocks its API too. Super Admin always has full access. Users are not affected — this only governs staff accounts."
          action={
            <div className="flex gap-2">
              {edits.size > 0 && (
                <Button variant="outline" size="sm" onClick={resetChanges}>
                  <RotateCcw className="h-3.5 w-3.5" /> Discard {edits.size} change{edits.size === 1 ? '' : 's'}
                </Button>
              )}
              <Button size="sm" onClick={save} loading={saving} disabled={edits.size === 0}>
                <Save className="h-3.5 w-3.5" /> Save changes
              </Button>
            </div>
          }
        />
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[1080px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-600">
                  Page
                </th>
                {matrix.roles.map((role) => (
                  <th
                    key={role}
                    colSpan={PERMISSION_ACTIONS.length}
                    className="border-l border-slate-200 px-4 py-2.5 text-left"
                  >
                    <Badge tone={ROLE_TONE[role] || 'slate'}>{role.replace('_', ' ')}</Badge>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200">
                <th className="sticky left-0 z-10 bg-white px-4 py-1.5"></th>
                {matrix.roles.map((role) =>
                  PERMISSION_ACTIONS.map((action, ai) => (
                    <th
                      key={`${role}-${action}`}
                      className={`px-4 py-1.5 text-left text-[11px] font-medium uppercase tracking-wide text-slate-400 ${
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
              {matrix.resources.map((resource) => (
                <tr key={resource.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-slate-800">
                    {resource.label}
                  </td>
                  {matrix.roles.map((role) =>
                    PERMISSION_ACTIONS.map((action, ai) => {
                      const allowed = isAllowed(role, resource.key, action);
                      const dirty = edits.has(key(role, resource.key, action));
                      // Create/update/delete are moot once the role can't even
                      // see the page — grey them out (still shows true state,
                      // just makes the dependency visible) rather than hide.
                      const pageHidden = action !== 'view' && !isAllowed(role, resource.key, 'view');
                      return (
                        <td
                          key={`${role}-${action}`}
                          className={`px-4 py-2.5 ${ai === 0 ? 'border-l border-slate-200' : ''}`}
                        >
                          <label
                            className={`inline-flex items-center gap-2 ${pageHidden ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                            title={pageHidden ? "View is off for this role — this page is unreachable regardless of this setting" : undefined}
                          >
                            <input
                              type="checkbox"
                              checked={allowed}
                              disabled={pageHidden}
                              onChange={() => toggle(role, resource.key, action)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
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
