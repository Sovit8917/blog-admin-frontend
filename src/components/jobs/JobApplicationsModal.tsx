'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FileText, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { listApplicationsForJob, updateApplicationStatus } from '@/lib/services/jobApplications';
import type { ApplicationStatus, JobApplication } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: ApplicationStatus[] = ['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN'];

export function JobApplicationsModal({
  jobId,
  jobTitle,
  open,
  onClose,
}: {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listApplicationsForJob(jobId));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load applicants'));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    try {
      await updateApplicationStatus(id, status);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      toast.success('Application status updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update status'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Applicants — ${jobTitle}`} width="xl">
      {loading ? (
        <PageSpinner label="Loading applicants…" />
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="No applications yet" description="Applicants who apply through the site will show up here." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Applicant</Th>
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
                  <p className="text-[11.5px] text-slate-400">{app.user?.email}</p>
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
      )}
    </Modal>
  );
}
