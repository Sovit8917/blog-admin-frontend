'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Eye, FileText, Users, Mail, Layers, Flame } from 'lucide-react';
import { fetchAnalyticsOverview } from '@/lib/services/analytics';
import type { AnalyticsOverview } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Input';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiErrorMessage } from '@/lib/api';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAnalyticsOverview(days));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <PageSpinner label="Loading analytics…" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Site-wide performance over the selected window.</p>
        <Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-44">
          {RANGE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Post views" value={data?.totalViews ?? 0} icon={Eye} />
        <StatCard label="Published posts" value={data?.totalPosts ?? 0} icon={FileText} tone="green" />
        <StatCard label="Total users" value={data?.totalUsers ?? 0} icon={Users} tone="violet" />
        <StatCard label="Confirmed subscribers" value={data?.totalSubscribers ?? 0} icon={Mail} tone="amber" />
      </div>

      {typeof data?.pendingInBuffer === 'number' && data.pendingInBuffer > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-700">
          <Layers className="h-4 w-4" />
          {data.pendingInBuffer} analytics events are queued and waiting to be flushed to the database.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800">
              <Layers className="h-4 w-4 text-brand-600" /> Events by type
            </h3>
            {!data?.eventsByType?.length ? (
              <EmptyState icon={Layers} title="No events recorded" />
            ) : (
              <div className="space-y-2">
                {data.eventsByType.map((e) => (
                  <div key={e.type} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <Badge tone="blue">{e.type.replace(/_/g, ' ')}</Badge>
                    <span className="text-[13px] font-medium text-slate-700">{e._count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800">
              <Flame className="h-4 w-4 text-brand-600" /> Top posts
            </h3>
            {!data?.topPosts?.length ? (
              <EmptyState icon={Flame} title="No published posts yet" />
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Post</Th>
                    <Th>Views</Th>
                    <Th>Likes</Th>
                  </tr>
                </Thead>
                <tbody>
                  {data.topPosts.map((p) => (
                    <Tr key={p.id}>
                      <Td className="max-w-[220px] truncate font-medium text-slate-800">{p.title}</Td>
                      <Td>{p.viewCount}</Td>
                      <Td>{p.likeCount}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
