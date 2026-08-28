'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Check, X } from 'lucide-react';
import {
  listEmployerRequests,
  approveEmployerRequest,
  rejectEmployerRequest,
} from '@/lib/services/employer-requests';
import type { EmployerRequest, EmployerRequestStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate, initials } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUSES: EmployerRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export default function EmployerRequestsPage() {
  const [items, setItems] = useState<EmployerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<EmployerRequestStatus | ''>('PENDING');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toReject, setToReject] = useState<EmployerRequest | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listEmployerRequests({ page, limit: 15, status: status || undefined });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load employer requests'));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  async function handleApprove(request: EmployerRequest) {
    setBusyId(request.id);
    try {
      await approveEmployerRequest(request.id);
      toast.success(`${request.user?.name ?? 'User'} now has employer access`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to approve request'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!toReject) return;
    setRejecting(true);
    try {
      await rejectEmployerRequest(toReject.id);
      toast.success('Request rejected');
      setToReject(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to reject request'));
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Employer requests</h1>
          <p className="text-[13px] text-slate-500">
            Users asking for permission to post jobs. Approving switches their role to Author.
          </p>
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as EmployerRequestStatus | '')} className="sm:w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading requests…" />
        ) : items.length === 0 ? (
          <EmptyState icon={Briefcase} title="No employer requests" description="Nothing matches this filter yet." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Requester</Th>
                  <Th>Company</Th>
                  <Th>Status</Th>
                  <Th>Requested</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                          {initials(r.user?.name || r.user?.username || '?')}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{r.user?.name}</p>
                          <p className="truncate text-[11.5px] text-slate-400">{r.user?.email ?? r.user?.username}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-slate-800">{r.companyName}</p>
                      {r.message && <p className="max-w-xs truncate text-[11.5px] text-slate-400">{r.message}</p>}
                    </Td>
                    <Td>
                      <Badge tone={statusTone(r.status)} dot>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </Badge>
                    </Td>
                    <Td>{formatDate(r.createdAt)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {r.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Approve"
                              disabled={busyId === r.id}
                              onClick={() => handleApprove(r)}
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Reject"
                              disabled={busyId === r.id}
                              onClick={() => setToReject(r)}
                            >
                              <X className="h-3.5 w-3.5 text-red-500" />
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
        open={!!toReject}
        onClose={() => setToReject(null)}
        onConfirm={handleReject}
        loading={rejecting}
        danger
        confirmLabel="Reject request"
        title={`Reject request from "${toReject?.user?.name}"?`}
        description="They'll be able to submit a new request later."
      />
    </div>
  );
}
