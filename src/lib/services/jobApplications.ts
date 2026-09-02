import { api, unwrap } from '../api';
import type { ApplicationStatus, JobApplication } from '../types';

export async function listApplicationsForJob(jobId: string) {
  const res = await api.get(`/cms/jobs/${jobId}/applications`);
  return unwrap<JobApplication[]>(res);
}

export interface ListApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus | '';
  jobId?: string;
}

export interface ApplicationsPage {
  items: JobApplication[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Backend returns { items, meta: { page, limit, total, totalPages } } (see
// JobApplicationsService / offsetMeta) — not flattened, so this must NOT be
// typed as PaginatedOffset<T>.
export async function listApplications(params: ListApplicationsParams = {}) {
  const res = await api.get('/cms/applications', { params });
  return unwrap<ApplicationsPage>(res);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const res = await api.patch(`/cms/applications/${id}/status`, { status });
  return unwrap<JobApplication>(res);
}
