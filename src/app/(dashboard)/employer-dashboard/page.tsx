'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Briefcase, Eye, Users, Bookmark, AlarmClock, BarChart3, TrendingUp } from 'lucide-react';
import { fetchEmployerDashboard, type EmployerDashboard } from '@/lib/services/employer';
import { useAuthStore, isStaff } from '@/lib/auth-store';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge, statusTone } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

// "Better employer dashboard" (#21) — an individual employer's own view of
// their listings (open/closed counts, funnel, top jobs, recent applicants),
// distinct from the site-wide /analytics page. AUTHOR posters only ever see
// their own jobs; staff (EDITOR/ADMIN/SUPER_ADMIN) can flip to "All jobs".
export default function EmployerDashboardPage() {
  const role = useAuthStore((s) => s.user?.role);
  const staff = isStaff(role);
  const [scopeAll, setScopeAll] = useState(false);
  const [data, setData] = useState<EmployerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchEmployerDashboard(scopeAll));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, [scopeAll]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <PageSpinner label="Loading your dashboard…" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">
          {data.scope === 'all' ? 'All job listings across the site.' : 'Your own job listings.'}
        </p>
        {staff && (
          <button
            onClick={() => setScopeAll((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              scopeAll
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {scopeAll ? 'Showing: All jobs' : 'Showing: My jobs'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total jobs" value={data.jobs.total} icon={Briefcase} />
        <StatCard label="Total views" value={data.views.total.toLocaleString()} icon={Eye} tone="violet" />
        <StatCard label="Applications" value={data.applications.total} icon={Users} tone="green" />
        <StatCard
          label="Apply rate"
          value={data.views.total > 0 ? `${((data.applications.total / data.views.total) * 100).toFixed(1)}%` : '—'}
          sub="applications / views"
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard label="Saved by seekers" value={data.savedByJobSeekers} icon={Bookmark} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Jobs by status" />
          <CardBody className="flex flex-wrap gap-2">
            {Object.entries(data.jobs.byStatus).map(([status, count]) => (
              <Badge key={status} tone={statusTone(status)} className="text-[12.5px]">
                {status}: {count}
              </Badge>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Applications by status" />
          <CardBody className="flex flex-wrap gap-2">
            {Object.entries(data.applications.byStatus).map(([status, count]) => (
              <Badge key={status} className="text-[12.5px]">
                {status.replace('_', ' ')}: {count}
              </Badge>
            ))}
          </CardBody>
        </Card>
      </div>

      {data.jobs.closingSoon.length > 0 && (
        <Card>
          <CardHeader
            title="Closing soon"
            description="Open roles expiring within 7 days."
          />
          <CardBody className="flex flex-col gap-2">
            {data.jobs.closingSoon.map((job) => (
              <div key={job.id} className="flex items-center justify-between text-[13px]">
                <Link href={`/jobs/${job.id}`} className="font-medium text-slate-700 hover:text-brand-600">
                  {job.title}
                </Link>
                <Badge tone="amber" className="gap-1">
                  <AlarmClock className="h-3 w-3" /> {formatDateTime(job.expiresAt)}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Top jobs" description="Ranked by applications, then views." />
        {data.topJobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs yet" description="Post a job to see it ranked here." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Title</Th>
                <Th>Company</Th>
                <Th>Status</Th>
                <Th>Views</Th>
                <Th>Applications</Th>
                <Th className="text-right">Analytics</Th>
              </tr>
            </Thead>
            <tbody>
              {data.topJobs.map((job) => (
                <Tr key={job.id}>
                  <Td className="font-medium text-slate-800">{job.title}</Td>
                  <Td>{job.company.name}</Td>
                  <Td>
                    <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                  </Td>
                  <Td>{job.viewCount}</Td>
                  <Td>{job.applicationCount}</Td>
                  <Td className="text-right">
                    <Link
                      href={`/employer-dashboard/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> View
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent applicants" />
        {data.recentApplications.length === 0 ? (
          <EmptyState icon={Users} title="No applications yet" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Job</Th>
                <Th>Status</Th>
                <Th>Applied</Th>
              </tr>
            </Thead>
            <tbody>
              {data.recentApplications.map((application) => (
                <Tr key={application.id}>
                  <Td>{application.user.name}</Td>
                  <Td>{application.job.title}</Td>
                  <Td>
                    <Badge tone={statusTone(application.status)}>{application.status}</Badge>
                  </Td>
                  <Td>{formatDateTime(application.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
