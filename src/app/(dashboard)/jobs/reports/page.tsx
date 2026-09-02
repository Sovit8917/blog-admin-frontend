'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Flag, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { listJobReports, reviewJobReport, flagJob, type JobReport } from '@/lib/services/jobs';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const REASON_LABEL: Record<string, string> = {
  SPAM: 'Spam',
  SCAM_OR_FRAUD: 'Scam or fraud',
  EXPIRED_OR_FILLED: 'Expired or filled',
  MISLEADING: 'Misleading',
  DUPLICATE: 'Duplicate',
  OTHER: 'Other',
};

export default function JobReportsPage() {
  const [items, setItems] = useState<JobReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'OPEN' | 'REVIEWED' | 'DISMISSED' | ''>('OPEN');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listJobReports(status || undefined)
      .then(setItems)
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load job reports')))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(id: string, next: 'REVIEWED' | 'DISMISSED') {
    setActingId(id);
    try {
      await reviewJobReport(id, next);
      toast.success(next === 'REVIEWED' ? 'Report marked reviewed' : 'Report dismissed');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update report'));
    } finally {
      setActingId(null);
    }
  }

  async function handleFlagJob(jobId: string, reportId: string) {
    setActingId(reportId);
    try {
      await flagJob(jobId);
      await reviewJobReport(reportId, 'REVIEWED');
      toast.success('Job flagged and report marked reviewed');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to flag job'));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Job Reports</h1>
          <p className="text-[13px] text-slate-500">Listings flagged by seekers as spam, scams, stale, or misleading.</p>
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-44">
          <option value="OPEN">Open</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All</option>
        </Select>
      </div>

      <Card className="p-0">
        {loading ? (
          <PageSpinner label="Loading reports…" />
        ) : items.length === 0 ? (
          <EmptyState icon={Flag} title="No reports" description="Nothing here for this filter." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Job</Th>
                <Th>Reason</Th>
                <Th>Reporter</Th>
                <Th>Reported</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <tbody>
              {items.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Link
                      href={`/jobs/${r.jobId}`}
                      className="flex items-center gap-1 font-medium text-slate-800 hover:text-brand-600"
                    >
                      {r.job.title} <ExternalLink className="h-3 w-3" />
                    </Link>
                    {r.job.verificationStatus === 'FLAGGED' && (
                      <Badge tone="red" className="mt-1">
                        Already flagged
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge tone="amber">{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                    {r.note && <p className="mt-1 max-w-xs truncate text-[12px] text-slate-500">{r.note}</p>}
                  </Td>
                  <Td className="text-[13px] text-slate-500">{r.reporter?.name || r.reporter?.username || 'Anonymous'}</Td>
                  <Td className="text-[13px] text-slate-500">{formatDateTime(r.createdAt)}</Td>
                  <Td>
                    <Badge tone={r.status === 'OPEN' ? 'amber' : r.status === 'REVIEWED' ? 'green' : 'slate'}>
                      {r.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {r.status === 'OPEN' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actingId === r.id}
                            onClick={() => handleFlagJob(r.jobId, r.id)}
                          >
                            <Flag className="h-3.5 w-3.5 text-red-500" /> Flag job
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actingId === r.id}
                            onClick={() => handleReview(r.id, 'REVIEWED')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Reviewed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actingId === r.id}
                            onClick={() => handleReview(r.id, 'DISMISSED')}
                          >
                            <XCircle className="h-3.5 w-3.5 text-slate-400" /> Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
