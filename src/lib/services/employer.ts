import { api, unwrap } from '../api';
import type { ApplicationStatus, JobStatus } from '../types';

export interface EmployerDashboard {
  scope: 'mine' | 'all';
  jobs: {
    total: number;
    byStatus: Record<JobStatus, number>;
    closingSoon: { id: string; title: string; slug: string; expiresAt: string }[];
  };
  views: { total: number };
  savedByJobSeekers: number;
  applications: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  };
  topJobs: {
    id: string;
    title: string;
    slug: string;
    status: JobStatus;
    viewCount: number;
    applicationCount: number;
    company: { name: string; slug: string };
  }[];
  recentApplications: {
    id: string;
    status: ApplicationStatus;
    createdAt: string;
    user: { id: string; name: string; username: string; avatarUrl?: string | null };
    job: { id: string; title: string; slug: string };
  }[];
}

export interface JobAnalytics {
  job: { id: string; title: string; slug: string; status: JobStatus; rejectionReason?: string | null };
  totals: { views: number; applications: number; saved: number; conversionRate: number };
  last30Days: {
    viewsByDay: { date: string; count: number }[];
    applicationsByDay: { date: string; count: number }[];
  };
  applicationsByStatus: Record<ApplicationStatus, number>;
}

/** GET /cms/employer/dashboard — "Better employer dashboard" (#21). */
export async function fetchEmployerDashboard(scopeAll = false) {
  const res = await api.get('/cms/employer/dashboard', { params: scopeAll ? { scope: 'all' } : {} });
  return unwrap<EmployerDashboard>(res);
}

/** GET /cms/employer/jobs/:id/analytics — "Employer analytics" (#22). */
export async function fetchJobAnalytics(jobId: string) {
  const res = await api.get(`/cms/employer/jobs/${jobId}/analytics`);
  return unwrap<JobAnalytics>(res);
}
