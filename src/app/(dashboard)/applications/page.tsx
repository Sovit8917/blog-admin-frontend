'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Search, Users, FileText, Mail } from 'lucide-react';
import { listApplications, updateApplicationStatus } from '@/lib/services/jobApplications';
import type { ApplicationStatus, JobApplication } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: ApplicationStatus[] = ['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN'];

export default function ApplicationsPage() {
  const [items, setItems] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listApplications({ page, limit: 15, search: search || undefined, status: status || undefined });
      setItems(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load applications'));
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

  async function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setUpdatingId(id);
    try {
      await updateApplicationStatus(id, newStatus);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
      toast.success('Application status updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update status'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search applicant name, email, or job…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | '')} className="sm:w-48">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-[13px] text-slate-500">{total} applications</p>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading applications…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applications found"
            description="Try adjusting your filters. Applicants who apply through the site show up here across every job."
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Applicant</Th>
                  <Th>Job</Th>
                  <Th>Applied</Th>
                  <Th>Resume</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((app) => (
                  <Tr key={app.id}>
                    <Td>
                      <p className="font-medium text-slate-800">{app.user?.name || app.user?.username}</p>
                      <p className="flex items-center gap-1 text-[11.5px] text-slate-400">
                        <Mail className="h-3 w-3" /> {app.user?.email}
                      </p>
                    </Td>
                    <Td className="max-w-[220px]">
                      {app.job ? (
                        <Link href={`/jobs/${app.job.id}`} className="hover:underline">
                          <p className="truncate font-medium text-slate-800">{app.job.title}</p>
                          <p className="truncate text-[11.5px] text-slate-400">{app.job.company?.name}</p>
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </Td>
                    <Td>{formatDateTime(app.createdAt)}</Td>
                    <Td>
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[12.5px] text-brand-600 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone(app.status)}>{app.status}</Badge>
                        <Select
                          value={app.status}
                          disabled={updatingId === app.id}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className="w-36"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
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
    </div>
  );
}
