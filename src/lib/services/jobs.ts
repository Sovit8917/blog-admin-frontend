import { api, unwrap } from '../api';
import type {
  EmploymentType,
  ExperienceLevel,
  Job,
  JobStatus,
  PaginatedOffset,
  RemoteType,
} from '../types';

export interface ListJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus | '';
  company?: string;
  remoteType?: RemoteType | '';
  employmentType?: EmploymentType | '';
  experienceLevel?: ExperienceLevel | '';
  location?: string;
  closingSoon?: boolean;
}

export async function listJobs(params: ListJobsParams = {}) {
  const res = await api.get('/cms/jobs', { params });
  return unwrap<PaginatedOffset<Job>>(res);
}

export async function getJob(id: string) {
  const res = await api.get(`/cms/jobs/${id}`);
  return unwrap<Job>(res);
}

export interface JobFormValues {
  title: string;
  companyId: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  location?: string;
  remoteType?: RemoteType;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel | '';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applyUrl?: string;
  allowInternalApply?: boolean;
  status?: JobStatus;
  expiresAt?: string;
  isFeatured?: boolean;
  skills?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

function cleanPayload(values: Partial<JobFormValues>) {
  const payload: any = { ...values };
  if (payload.experienceLevel === '') delete payload.experienceLevel;
  if (payload.salaryMin === undefined || Number.isNaN(payload.salaryMin)) delete payload.salaryMin;
  if (payload.salaryMax === undefined || Number.isNaN(payload.salaryMax)) delete payload.salaryMax;
  if (!payload.applyUrl) delete payload.applyUrl;
  if (!payload.expiresAt) delete payload.expiresAt;
  return payload;
}

export async function createJob(values: JobFormValues) {
  const res = await api.post('/cms/jobs', cleanPayload(values));
  return unwrap<Job>(res);
}

export async function updateJob(id: string, values: Partial<JobFormValues>) {
  const res = await api.patch(`/cms/jobs/${id}`, cleanPayload(values));
  return unwrap<Job>(res);
}

export async function deleteJob(id: string) {
  const res = await api.delete(`/cms/jobs/${id}`);
  return unwrap<{ message: string }>(res);
}
