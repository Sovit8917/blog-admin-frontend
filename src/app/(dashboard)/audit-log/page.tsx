'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { History, Search } from 'lucide-react';
import { listAuditLog } from '@/lib/services/auditLog';
import type { AuditLogEntry } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

function actionTone(action: string): 'red' | 'green' | 'blue' | 'slate' {
  if (action.includes('DELETE')) return 'red';
  if (action.includes('CREATE')) return 'green';
  if (action.includes('UPDATE')) return 'blue';
  return 'slate';
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAuditLog({
        page,
        limit: 25,
        entityType: entityType || undefined,
        action: action || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load audit log'));
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [entityType, action]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Entity type (e.g. Post)…" value={entityType} onChange={(e) => setEntityType(e.target.value)} className="pl-9" />
        </div>
        <div className="relative sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Action (e.g. POST_DELETE)…" value={action} onChange={(e) => setAction(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading audit log…" />
        ) : items.length === 0 ? (
          <EmptyState icon={History} title="No activity found" description="Try adjusting your filters." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                  <Th>User</Th>
                  <Th>IP</Th>
                  <Th>When</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((entry) => (
                  <Tr key={entry.id}>
                    <Td>
                      <Badge tone={actionTone(entry.action)}>{entry.action}</Badge>
                    </Td>
                    <Td>
                      <p className="font-medium text-slate-700">{entry.entityType}</p>
                      {entry.entityId && <p className="truncate text-[11px] text-slate-400">{entry.entityId}</p>}
                    </Td>
                    <Td>{entry.user?.name || entry.user?.username || <span className="text-slate-300">System</span>}</Td>
                    <Td className="text-[12px] text-slate-500">{entry.ipAddress || '—'}</Td>
                    <Td>{formatDateTime(entry.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={25} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
