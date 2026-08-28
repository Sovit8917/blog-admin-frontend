'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  MessageSquare,
  Mail,
  Briefcase,
  Megaphone,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { fetchDashboard } from '@/lib/services/dashboard';
import type { DashboardStats } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner label="Loading dashboard…" />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0] || user?.username} 👋
        </h2>
        <p className="mt-0.5 text-[13px] text-slate-500">Here&apos;s what&apos;s happening across your blog.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Posts"
          value={stats.posts.total}
          sub={`${stats.posts.published} published · ${stats.posts.draft} drafts`}
          icon={FileText}
          tone="brand"
        />
        <StatCard label="Total Users" value={stats.users.total} icon={Users} tone="violet" />
        <StatCard
          label="Comments"
          value={stats.comments.total}
          sub={`${stats.comments.pending} pending review`}
          icon={MessageSquare}
          tone="amber"
        />
        <StatCard
          label="Newsletter Subscribers"
          value={stats.newsletter.confirmedSubscribers}
          icon={Mail}
          tone="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Active Ads"
          value={stats.monetization.activeAds}
          icon={Megaphone}
          tone="brand"
        />
        <StatCard label="Active Sponsors" value={stats.monetization.activeSponsors} icon={Megaphone} tone="violet" />
        <StatCard
          label="Job Postings"
          value={stats.jobs.total}
          sub={`${stats.jobs.open} open · ${stats.jobs.applications} applications`}
          icon={Briefcase}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recently updated posts"
            action={
              <Link href="/posts" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {stats.recentPosts.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-slate-400">No posts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {stats.recentPosts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/posts/${p.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-slate-800">{p.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-400">
                          <Clock className="h-3 w-3" /> {formatDateTime(p.updatedAt)}
                        </p>
                      </div>
                      <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" description="Latest audit log entries" />
          <CardBody className="p-0">
            {stats.recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-slate-400">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {stats.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-700">
                        {a.action.replace(/_/g, ' ')} <span className="text-slate-400">· {a.entityType}</span>
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-slate-400">
                        {a.user?.name || a.user?.username || 'System'} · {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
