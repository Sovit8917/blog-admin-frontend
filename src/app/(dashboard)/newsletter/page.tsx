'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Mail, Users, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { listSubscribers, fetchNewsletterStats } from '@/lib/services/newsletter';
import type { NewsletterStats, NewsletterSubscriber, SubscriberStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: SubscriberStatus[] = ['PENDING', 'CONFIRMED', 'UNSUBSCRIBED', 'BOUNCED'];

const STATUS_TONE: Record<SubscriberStatus, 'green' | 'amber' | 'slate' | 'red'> = {
  CONFIRMED: 'green',
  PENDING: 'amber',
  UNSUBSCRIBED: 'slate',
  BOUNCED: 'red',
};

export default function NewsletterPage() {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [items, setItems] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<SubscriberStatus | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, s] = await Promise.all([
        listSubscribers({ page, limit: 20, status: status || undefined }),
        fetchNewsletterStats(),
      ]);
      setItems(subs.items);
      setTotal(subs.total);
      setTotalPages(subs.totalPages || Math.max(1, Math.ceil(subs.total / subs.limit)));
      setStats(s);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load subscribers'));
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total subscribers" value={stats?.total ?? '—'} icon={Users} />
        <StatCard label="Confirmed" value={stats?.confirmed ?? '—'} icon={CheckCircle2} tone="green" />
        <StatCard label="Pending" value={stats?.pending ?? '—'} icon={Clock} tone="amber" />
        <StatCard label="Unsubscribed" value={stats?.unsubscribed ?? '—'} icon={XCircle} tone="violet" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{total} subscribers</p>
        <Select value={status} onChange={(e) => setStatus(e.target.value as SubscriberStatus | '')} className="w-44">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading subscribers…" />
        ) : items.length === 0 ? (
          <EmptyState icon={Mail} title="No subscribers found" description="Try adjusting your filters." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Subscribed</Th>
                  <Th>Confirmed</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((sub) => (
                  <Tr key={sub.id}>
                    <Td className="font-medium text-slate-800">{sub.email}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[sub.status]}>{sub.status}</Badge>
                    </Td>
                    <Td>{sub.source || <span className="text-slate-300">—</span>}</Td>
                    <Td>{formatDateTime(sub.subscribedAt)}</Td>
                    <Td>{formatDateTime(sub.confirmedAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
