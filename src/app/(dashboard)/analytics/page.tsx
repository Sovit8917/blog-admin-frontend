'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Eye,
  FileText,
  Users,
  Mail,
  Layers,
  Flame,
  Sparkles,
  MousePointerClick,
  Briefcase,
  Megaphone,
  Handshake,
  Link2,
  ArrowUpRight,
} from 'lucide-react';
import { fetchAnalyticsOverview, fetchMostRead, fetchRecommendationStats, fetchRevenueOverview } from '@/lib/services/analytics';
import type { AnalyticsOverview, MostReadEntry, PostType, RecommendationStats, RevenueOverview } from '@/lib/types';
import { CAREER_CONTENT_TYPES } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Input';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const POST_TYPE_LABELS: Record<PostType, string> = {
  ARTICLE: 'Article',
  TUTORIAL: 'Tutorial',
  NEWS: 'News',
  CAREER_ADVICE: 'Career Advice',
  INTERVIEW_PREP: 'Interview Prep',
  RESUME_TIPS: 'Resume Tips',
  SALARY_GUIDE: 'Salary Guide',
};

const SOURCE_LABELS: Record<string, string> = {
  followed_author: 'Followed Author',
  followed_topic: 'Followed Topic',
  read_similarity: 'Read Similarity',
  trending_fallback: 'Trending Fallback',
  unknown: 'Unknown',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [mostRead, setMostRead] = useState<MostReadEntry[] | null>(null);
  const [recStats, setRecStats] = useState<RecommendationStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, top, rec, rev] = await Promise.all([
        fetchAnalyticsOverview(days),
        fetchMostRead(days, 10),
        fetchRecommendationStats(days),
        fetchRevenueOverview(),
      ]);
      setData(overview);
      setMostRead(top);
      setRecStats(rec);
      setRevenue(rev);
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

      {/* MONETIZATION — quick jump into each revenue channel's own dashboard;
          site analytics above answers "how's the content doing", this answers
          "where's the money" without duplicating each page's own metrics. */}
      <Card>
        <CardBody>
          <h3 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800">
            <Handshake className="h-4 w-4 text-brand-600" /> Revenue channels
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                href: '/employer-dashboard',
                label: 'Featured jobs',
                icon: Briefcase,
                tone: 'brand',
                stat: revenue ? `${revenue.jobs.featured}/${revenue.jobs.openTotal} open` : undefined,
              },
              {
                href: '/sponsors',
                label: 'Sponsors & sponsored content',
                icon: Megaphone,
                tone: 'amber',
                stat: revenue ? `${revenue.sponsors.active} active · ${revenue.sponsors.sponsoredPosts} posts` : undefined,
              },
              {
                href: '/affiliate-links',
                label: 'Affiliate links',
                icon: Link2,
                tone: 'violet',
                stat: revenue ? `${revenue.affiliate.activeLinks} links · ${revenue.affiliate.totalClicks} clicks` : undefined,
              },
              {
                href: '/newsletter',
                label: 'Newsletter sponsorship',
                icon: Mail,
                tone: 'brand',
                stat: revenue ? `${revenue.newsletter.upcomingSponsorSlots} booked · ${revenue.newsletter.sponsorSlotClicks} clicks` : undefined,
              },
              {
                href: '/ads',
                label: 'Display ads',
                icon: MousePointerClick,
                tone: 'green',
                stat: revenue ? `${revenue.ads.active} active · ${revenue.ads.ctr}% CTR` : undefined,
              },
            ].map(({ href, label, icon: Icon, tone, stat }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-[12.5px] font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        tone === 'brand' && 'bg-brand-100 text-brand-600',
                        tone === 'green' && 'bg-emerald-100 text-emerald-600',
                        tone === 'amber' && 'bg-amber-100 text-amber-600',
                        tone === 'violet' && 'bg-violet-100 text-violet-600',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-brand-500" />
                </div>
                {stat && <p className="pl-9 text-[11.5px] font-normal text-slate-500">{stat}</p>}
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

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

      <Card>
        <CardBody>
          <h3 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800">
            <Flame className="h-4 w-4 text-brand-600" /> Most read — content performance ({days}d)
          </h3>
          {!mostRead?.length ? (
            <EmptyState icon={Flame} title="Not enough data yet" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Post</Th>
                  <Th>Type</Th>
                  <Th>Views ({days}d)</Th>
                  <Th>Unique</Th>
                  <Th>Likes</Th>
                  <Th>Comments</Th>
                </tr>
              </Thead>
              <tbody>
                {mostRead.map((m) => (
                  <Tr key={m.post.id}>
                    <Td className="max-w-[260px] truncate font-medium text-slate-800">{m.post.title}</Td>
                    <Td>
                      <Badge tone={CAREER_CONTENT_TYPES.includes(m.post.postType) ? 'violet' : 'slate'}>
                        {POST_TYPE_LABELS[m.post.postType] || m.post.postType}
                      </Badge>
                    </Td>
                    <Td>{m.periodViews}</Td>
                    <Td>{m.periodUniqueViews ?? <span className="text-slate-300">—</span>}</Td>
                    <Td>{m.post.likeCount}</Td>
                    <Td>{m.post.commentCount}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-brand-600" /> Recommendation performance ({days}d)
            </h3>
            {recStats && (
              <span className="flex items-center gap-1 text-[12.5px] text-slate-500">
                <MousePointerClick className="h-3.5 w-3.5" /> {recStats.overallCtr}% overall CTR
              </span>
            )}
          </div>
          {!recStats || recStats.totalImpressions === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recommendation data yet"
              description="Impressions and clicks from the 'For You' feed will show up here once the public site starts logging them."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[12px] font-medium text-slate-500">By recommendation reason</p>
                <div className="space-y-2">
                  {recStats.bySource.map((s) => (
                    <div key={s.source} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <Badge tone="violet">{SOURCE_LABELS[s.source] || s.source}</Badge>
                      <span className="text-[12px] text-slate-500">
                        {s.clicks}/{s.impressions} clicks · <span className="font-medium text-slate-700">{s.ctr}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-medium text-slate-500">Top clicked recommended posts</p>
                {!recStats.topClickedPosts.length ? (
                  <p className="text-[13px] text-slate-400">No clicks recorded yet.</p>
                ) : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Post</Th>
                        <Th>Clicks</Th>
                      </tr>
                    </Thead>
                    <tbody>
                      {recStats.topClickedPosts.map((t) => (
                        <Tr key={t.post.id}>
                          <Td className="max-w-[220px] truncate font-medium text-slate-800">{t.post.title}</Td>
                          <Td>{t.clicks}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
