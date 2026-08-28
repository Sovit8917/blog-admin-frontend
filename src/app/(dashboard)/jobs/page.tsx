'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Search, Briefcase, Pencil, Trash2, Star, Users } from 'lucide-react';
import { listJobs, deleteJob } from '@/lib/services/jobs';
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
import { JobApplicationsModal } from '@/components/jobs/JobApplicationsModal';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: JobStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED'];

export default function JobsPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<JobStatus | ''>('');
  const [toDelete, setToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [applicantsFor, setApplicantsFor] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listJobs({ page, limit: 12, search: search || undefined, status: status || undefined });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load jobs'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

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
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </Link>
      </div>

      <Card>
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
                  <Th>Title</Th>
                  <Th>Company</Th>
                  <Th>Status</Th>
                  <Th>Applicants</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((job) => (
                  <Tr key={job.id}>
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
                      <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                    </Td>
                    <Td>
                      <button
                        onClick={() => setApplicantsFor(job)}
                        className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[12px] text-slate-600 hover:bg-slate-100"
                      >
                        <Users className="h-3.5 w-3.5" /> {job.applicationCount}
                      </button>
                    </Td>
                    <Td>{formatDateTime(job.updatedAt)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
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
    </div>
  );
}
