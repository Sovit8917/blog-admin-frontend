import { api, unwrap } from '../api';
import type { ApplicationStatus, JobApplication, PaginatedOffset } from '../types';

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

export async function listApplications(params: ListApplicationsParams = {}) {
  const res = await api.get('/cms/applications', { params });
  return unwrap<PaginatedOffset<JobApplication>>(res);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const res = await api.patch(`/cms/applications/${id}/status`, { status });
  return unwrap<JobApplication>(res);
}
