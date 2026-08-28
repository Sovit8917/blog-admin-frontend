import { api, unwrap } from '../api';
import type { AdPlacement, Advertisement } from '../types';

export async function listAds() {
  const res = await api.get('/cms/ads');
  return unwrap<Advertisement[]>(res);
}

export interface AdFormValues {
  title: string;
  placement: AdPlacement;
  imageUrl: string;
  targetUrl: string;
  advertiser?: string;
  startDate?: string;
  endDate?: string;
  priority?: number;
  isActive?: boolean;
}

export async function createAd(values: AdFormValues) {
  const res = await api.post('/cms/ads', values);
  return unwrap<Advertisement>(res);
}

export async function updateAd(id: string, values: AdFormValues) {
  const res = await api.patch(`/cms/ads/${id}`, values);
  return unwrap<Advertisement>(res);
}

export async function deleteAd(id: string) {
  const res = await api.delete(`/cms/ads/${id}`);
  return unwrap<{ message: string }>(res);
}
