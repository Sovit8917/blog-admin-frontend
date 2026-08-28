import { api, unwrap } from '../api';
import type { AffiliateLink } from '../types';

export async function listAffiliateLinks() {
  const res = await api.get('/cms/affiliate-links');
  return unwrap<AffiliateLink[]>(res);
}

export interface CreateAffiliateLinkValues {
  title: string;
  originalUrl: string;
  postId?: string;
  program?: string;
}

export interface UpdateAffiliateLinkValues {
  title?: string;
  originalUrl?: string;
  isActive?: boolean;
  program?: string;
}

export async function createAffiliateLink(values: CreateAffiliateLinkValues) {
  const payload = { ...values, postId: values.postId || undefined };
  const res = await api.post('/cms/affiliate-links', payload);
  return unwrap<AffiliateLink>(res);
}

export async function updateAffiliateLink(id: string, values: UpdateAffiliateLinkValues) {
  const res = await api.patch(`/cms/affiliate-links/${id}`, values);
  return unwrap<AffiliateLink>(res);
}

export async function deleteAffiliateLink(id: string) {
  const res = await api.delete(`/cms/affiliate-links/${id}`);
  return unwrap<{ message: string }>(res);
}
