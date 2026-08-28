import { api, unwrap } from '../api';
import type { ApplicationStatus, JobApplication } from '../types';

export async function listApplicationsForJob(jobId: string) {
  const res = await api.get(`/cms/jobs/${jobId}/applications`);
  return unwrap<JobApplication[]>(res);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const res = await api.patch(`/cms/applications/${id}/status`, { status });
  return unwrap<JobApplication>(res);
}
