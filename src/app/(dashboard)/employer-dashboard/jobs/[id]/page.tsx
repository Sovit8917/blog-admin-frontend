'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, Users, Bookmark, TrendingUp } from 'lucide-react';
import { fetchJobAnalytics, type JobAnalytics } from '@/lib/services/employer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, statusTone } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { apiErrorMessage } from '@/lib/api';

/** A dependency-free bar sparkline — the trailing 30-day series is small
 * enough that pulling in a charting library for this one view isn't worth it. */
function DaySeriesBars({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="flex h-24 items-end gap-[3px]">
      {series.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count}`}
          className="flex-1 rounded-t bg-brand-200 transition-colors hover:bg-brand-400"
          style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function JobAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<JobAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobAnalytics(id)
      .then(setData)
      .catch((err) => {
        toast.error(apiErrorMessage(err, 'Failed to load analytics'));
        router.push('/employer-dashboard');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <PageSpinner label="Loading analytics…" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push('/employer-dashboard')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </button>

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{data.job.title}</h2>
        <Badge tone={statusTone(data.job.status)}>{data.job.status.replace('_', ' ')}</Badge>
      </div>

      {data.job.status === 'PENDING_APPROVAL' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          This listing is awaiting review by an editor or admin before it goes live.
        </div>
      )}
      {data.job.status === 'REJECTED' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          This listing was rejected{data.job.rejectionReason ? `: ${data.job.rejectionReason}` : '.'} Edit it and
          resubmit for approval.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Views (all time)" value={data.totals.views} icon={Eye} tone="violet" />
        <StatCard label="Applications" value={data.totals.applications} icon={Users} tone="green" />
        <StatCard label="Saved" value={data.totals.saved} icon={Bookmark} tone="amber" />
        <StatCard
          label="View → apply rate"
          value={`${(data.totals.conversionRate * 100).toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Views — last 30 days" />
          <CardBody>
            <DaySeriesBars series={data.last30Days.viewsByDay} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Applications — last 30 days" />
          <CardBody>
            <DaySeriesBars series={data.last30Days.applicationsByDay} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Applications by status" />
        <CardBody className="flex flex-wrap gap-2">
          {Object.entries(data.applicationsByStatus).map(([status, count]) => (
            <Badge key={status} tone={statusTone(status)} className="text-[12.5px]">
              {status.replace('_', ' ')}: {count}
            </Badge>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
