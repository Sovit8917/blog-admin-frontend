import { api, unwrap } from '../api';
import type { Sponsor, SponsorTier } from '../types';

export async function listSponsors() {
  const res = await api.get('/cms/sponsors');
  return unwrap<Sponsor[]>(res);
}

export interface SponsorFormValues {
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  tier?: SponsorTier;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export async function createSponsor(values: SponsorFormValues) {
  const res = await api.post('/cms/sponsors', values);
  return unwrap<Sponsor>(res);
}

export async function updateSponsor(id: string, values: SponsorFormValues) {
  const res = await api.patch(`/cms/sponsors/${id}`, values);
  return unwrap<Sponsor>(res);
}

export async function deleteSponsor(id: string) {
  const res = await api.delete(`/cms/sponsors/${id}`);
  return unwrap<{ message: string }>(res);
}

export async function attachSponsorToPost(postId: string, sponsorId: string, disclosure?: string) {
  const res = await api.post('/cms/sponsors/attach', { postId, sponsorId, disclosure });
  return unwrap(res);
}

export async function detachSponsorFromPost(postId: string) {
  const res = await api.delete(`/cms/sponsors/detach/${postId}`);
  return unwrap<{ message: string }>(res);
}
