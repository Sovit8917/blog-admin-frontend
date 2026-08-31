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
  BookOpenText as ResourceIcon,
  Code2,
  AlarmClock,
  Flame,
  Eye,
  Send,
} from 'lucide-react';
import { fetchDashboard } from '@/lib/services/dashboard';
import type { DashboardStats, PostType } from '@/lib/types';
import { CAREER_CONTENT_TYPES } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiErrorMessage } from '@/lib/api';
import { ShieldOff } from 'lucide-react';

const POST_TYPE_LABELS: Record<PostType, string> = {
  ARTICLE: 'Article',
  TUTORIAL: 'Tutorial',
  NEWS: 'News',
  CAREER_ADVICE: 'Career Advice',
  INTERVIEW_PREP: 'Interview Prep',
  RESUME_TIPS: 'Resume Tips',
  SALARY_GUIDE: 'Salary Guide',
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load the dashboard')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner label="Loading dashboard…" />;

  if (error) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Dashboard unavailable"
        description={error}
      />
    );
  }

  if (!stats) return null;

  const byTypeArray = Array.isArray(stats.posts?.byType)
    ? stats.posts.byType
    : typeof stats.posts?.byType === 'object' && stats.posts?.byType !== null
      ? Object.entries(stats.posts.byType).map(([postType, count]) => ({
          postType: postType as PostType,
          _count: typeof count === 'number' ? count : Number(count) || 0,
        }))
      : [];

  const careerCount = byTypeArray
    .filter((t) => CAREER_CONTENT_TYPES.includes(t.postType))
    .reduce((sum, t) => sum + t._count, 0);

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
        <StatCard label="Total Users" value={stats.users.total} sub={`${stats.users.new7d} new (7d)`} icon={Users} tone="violet" />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Ads" value={stats.monetization.activeAds} icon={Megaphone} tone="brand" />
        <StatCard label="Active Sponsors" value={stats.monetization.activeSponsors} icon={Megaphone} tone="violet" />
        <StatCard
          label="Job Postings"
          value={stats.jobs.total}
          sub={`${stats.jobs.open} open · ${stats.jobs.applications} applications`}
          icon={Briefcase}
          tone="amber"
        />
        <StatCard
          label="Jobs Closing Soon"
          value={stats.jobs.closingSoon?.count ?? 0}
          sub="within 7 days"
          icon={AlarmClock}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/posts?status=IN_REVIEW">
          <StatCard
            label="Pending Review"
            value={stats.posts.pendingReview ?? 0}
            sub="Posts awaiting editor approval"
            icon={Send}
            tone={stats.posts.pendingReview ? 'amber' : 'brand'}
          />
        </Link>
        <StatCard
          label="Career Content"
          value={careerCount}
          sub="Advice · Interview · Resume · Salary"
          icon={ResourceIcon}
          tone="violet"
        />
        <StatCard
          label="Developer Resources"
          value={stats.developerResources?.total ?? 0}
          sub={`${stats.developerResources?.active ?? 0} active · ${stats.developerResources?.featured ?? 0} featured`}
          icon={Code2}
          tone="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Jobs closing soon"
            description="Open roles expiring within the next 7 days"
            action={
              <Link href="/jobs" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {!stats.jobs.closingSoon?.items?.length ? (
              <p className="px-5 py-8 text-center text-[13px] text-slate-400">No jobs closing soon.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {stats.jobs.closingSoon.items.map((j) => (
                  <li key={j.id}>
                    <Link href={`/jobs/${j.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-slate-800">{j.title}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-slate-400">{j.company?.name}</p>
                      </div>
                      <Badge tone={daysUntil(j.expiresAt) <= 2 ? 'red' : 'amber'}>
                        {daysUntil(j.expiresAt)}d left
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Most read (7d)"
            description="Top performing content by views"
            action={
              <Link href="/analytics" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {!stats.mostRead?.length ? (
              <p className="px-5 py-8 text-center text-[13px] text-slate-400">Not enough data yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {stats.mostRead.map((m) => (
                  <li key={m.post.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <Flame className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-slate-800">{m.post.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-slate-400">{POST_TYPE_LABELS[m.post.postType]}</p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] text-slate-500">
                      <Eye className="h-3.5 w-3.5" /> {m.periodViews}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
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
            {!stats.recentPosts?.length ? (
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
            {!stats.recentActivity?.length ? (
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

