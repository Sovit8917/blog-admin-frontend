'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Briefcase,
  Pencil,
  Trash2,
  Star,
  Users,
  AlarmClock,
  CheckCircle2,
  XCircle,
  FileEdit,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import {
  listJobs,
  deleteJob,
  bulkJobAction,
  approveJob,
  rejectJob,
  type JobBulkAction,
} from '@/lib/services/jobs';
import { RejectJobDialog } from '@/components/jobs/RejectJobDialog';
import type { Job, JobStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { JobApplicationsModal } from '@/components/jobs/JobApplicationsModal';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: JobStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'OPEN', 'REJECTED', 'CLOSED', 'EXPIRED'];

export default function JobsPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<JobStatus | ''>('');
  const [closingSoon, setClosingSoon] = useState(false);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [toDelete, setToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [applicantsFor, setApplicantsFor] = useState<Job | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toReject, setToReject] = useState<Job | null>(null);
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listJobs({
        page,
        limit: 12,
        search: search || undefined,
        status: status || undefined,
        closingSoon: closingSoon || undefined,
        sortBy,
        sortOrder,
      });
      setItems(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      setSelected(new Set());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load jobs'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, closingSoon, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, closingSoon, sortBy, sortOrder]);

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(items.map((i) => i.id)) : new Set());
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteJob(toDelete.id);
      toast.success('Job deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete job'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleApprove(job: Job) {
    setReviewBusyId(job.id);
    try {
      await approveJob(job.id);
      toast.success(`"${job.title}" approved and published`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to approve job'));
    } finally {
      setReviewBusyId(null);
    }
  }

  async function handleReject(reason?: string) {
    if (!toReject) return;
    setReviewBusyId(toReject.id);
    try {
      await rejectJob(toReject.id, reason);
      toast.success(`"${toReject.title}" rejected`);
      setToReject(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to reject job'));
    } finally {
      setReviewBusyId(null);
    }
  }

  async function handleBulk(action: JobBulkAction) {
    setBulkBusy(true);
    try {
      const res = await bulkJobAction([...selected], action);
      toast.success(`Updated ${res.updated} job(s)`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Bulk action failed'));
    } finally {
      setBulkBusy(false);
    }
  }

  const activeSort = { sortBy, sortOrder };
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as JobStatus | '')} className="sm:w-44">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <button
            onClick={() => setClosingSoon((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
              closingSoon
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlarmClock className="h-4 w-4" /> Closing soon
          </button>
          <button
            onClick={() => setStatus((s) => (s === 'PENDING_APPROVAL' ? '' : 'PENDING_APPROVAL'))}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
              status === 'PENDING_APPROVAL'
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Pending approval
          </button>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </Link>
      </div>

      <Card>
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Publish', icon: CheckCircle2, onClick: () => handleBulk('publish'), loading: bulkBusy },
            { label: 'Close', icon: XCircle, onClick: () => handleBulk('close'), loading: bulkBusy },
            { label: 'Move to draft', icon: FileEdit, onClick: () => handleBulk('draft'), loading: bulkBusy },
            { label: 'Delete', icon: Trash2, variant: 'danger', onClick: () => handleBulk('delete'), loading: bulkBusy },
          ]}
        />
        {loading ? (
          <PageSpinner label="Loading jobs…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description="Try adjusting your filters, or post your first job."
            action={
              <Link href="/jobs/new" className="mt-3">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> New Job
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th className="w-10">
                    <Checkbox checked={allSelected} onChange={toggleAll} ariaLabel="Select all" />
                  </Th>
                  <Th sortKey="title" activeSort={activeSort} onSort={handleSort}>
                    Title
                  </Th>
                  <Th>Company</Th>
                  <Th sortKey="status" activeSort={activeSort} onSort={handleSort}>
                    Status
                  </Th>
                  <Th sortKey="applicationCount" activeSort={activeSort} onSort={handleSort}>
                    Applicants
                  </Th>
                  <Th sortKey="expiresAt" activeSort={activeSort} onSort={handleSort}>
                    Expires
                  </Th>
                  <Th sortKey="updatedAt" activeSort={activeSort} onSort={handleSort}>
                    Updated
                  </Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((job) => (
                  <Tr key={job.id}>
                    <Td>
                      <Checkbox
                        checked={selected.has(job.id)}
                        onChange={(c) => toggleOne(job.id, c)}
                        ariaLabel={`Select ${job.title}`}
                      />
                    </Td>
                    <Td className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {job.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{job.title}</p>
                          <p className="truncate text-[11.5px] text-slate-400">
                            {job.employmentType.replace('_', ' ')} · {job.remoteType}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>{job.company?.name || <span className="text-slate-300">—</span>}</Td>
                    <Td>
                      <Badge tone={statusTone(job.status)}>{job.status.replace('_', ' ')}</Badge>
                      {job.status === 'REJECTED' && job.rejectionReason && (
                        <p className="mt-1 max-w-[180px] truncate text-[11px] text-slate-400" title={job.rejectionReason}>
                          {job.rejectionReason}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <button
                        onClick={() => setApplicantsFor(job)}
                        className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[12px] text-slate-600 hover:bg-slate-100"
                      >
                        <Users className="h-3.5 w-3.5" /> {job.applicationCount}
                      </button>
                    </Td>
                    <Td>
                      {job.status === 'OPEN' && job.expiresAt ? (
                        (() => {
                          const days = Math.ceil((new Date(job.expiresAt).getTime() - Date.now()) / 86400000);
                          if (days <= 7) {
                            return (
                              <Badge tone={days <= 2 ? 'red' : 'amber'} className="gap-1">
                                <AlarmClock className="h-3 w-3" /> {days <= 0 ? 'Expired' : `${days}d left`}
                              </Badge>
                            );
                          }
                          return <span className="text-[12px] text-slate-400">{formatDateTime(job.expiresAt)}</span>;
                        })()
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </Td>
                    <Td>{formatDateTime(job.updatedAt)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        {job.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Approve"
                              disabled={reviewBusyId === job.id}
                              onClick={() => handleApprove(job)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Reject"
                              disabled={reviewBusyId === job.id}
                              onClick={() => setToReject(job)}
                            >
                              <ShieldX className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="outline" size="icon" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(job)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={12} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${toDelete?.title}"?`}
        description="This soft-deletes the job listing."
      />

      {applicantsFor && (
        <JobApplicationsModal
          jobId={applicantsFor.id}
          jobTitle={applicantsFor.title}
          open={!!applicantsFor}
          onClose={() => setApplicantsFor(null)}
        />
      )}

      <RejectJobDialog
        open={!!toReject}
        jobTitle={toReject?.title}
        loading={reviewBusyId === toReject?.id}
        onClose={() => setToReject(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
