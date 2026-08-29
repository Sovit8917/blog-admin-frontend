import { api, unwrap } from '../api';
import type { DeveloperResource, PaginatedOffset, ResourceType } from '../types';

export interface ListDeveloperResourcesParams {
  page?: number;
  limit?: number;
  search?: string;
  resourceType?: ResourceType | '';
  isActive?: boolean;
}

export async function listDeveloperResources(params: ListDeveloperResourcesParams = {}) {
  const res = await api.get('/cms/developer-resources', { params });
  return unwrap<PaginatedOffset<DeveloperResource>>(res);
}

export async function fetchDeveloperResourceStats() {
  const res = await api.get('/cms/developer-resources/stats');
  return unwrap<{ total: number; active: number; featured: number; byType: { resourceType: ResourceType; _count: number }[] }>(res);
}

export interface DeveloperResourceFormValues {
  title: string;
  url: string;
  description?: string;
  resourceType?: ResourceType;
  tags?: string[];
  iconUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  order?: number;
}

export async function createDeveloperResource(values: DeveloperResourceFormValues) {
  const res = await api.post('/cms/developer-resources', values);
  return unwrap<DeveloperResource>(res);
}

export async function updateDeveloperResource(id: string, values: Partial<DeveloperResourceFormValues>) {
  const res = await api.patch(`/cms/developer-resources/${id}`, values);
  return unwrap<DeveloperResource>(res);
}

export async function deleteDeveloperResource(id: string) {
  const res = await api.delete(`/cms/developer-resources/${id}`);
  return unwrap<{ message: string }>(res);
}
