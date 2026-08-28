import { api, unwrap } from '../api';
import type { Company, PaginatedOffset } from '../types';

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listCompanies(params: ListCompaniesParams = {}) {
  const res = await api.get('/companies', { params });
  return unwrap<PaginatedOffset<Company>>(res);
}

export interface CompanyFormValues {
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  location?: string;
  isVerified?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export async function createCompany(values: CompanyFormValues) {
  // isVerified isn't accepted on create — the backend defaults it; set via update if needed.
  const { isVerified, ...createable } = values;
  const res = await api.post('/companies', createable);
  return unwrap<Company>(res);
}

export async function updateCompany(id: string, values: Partial<CompanyFormValues>) {
  const res = await api.patch(`/companies/${id}`, values);
  return unwrap<Company>(res);
}

export async function deleteCompany(id: string) {
  const res = await api.delete(`/companies/${id}`);
  return unwrap<{ message: string }>(res);
}
