import { api, unwrap } from '../api';
import type { NewsletterStats, NewsletterSubscriber, NewsletterSponsorSlot, PaginatedOffset, SubscriberStatus } from '../types';

export async function listSubscribers(params: { page?: number; limit?: number; status?: SubscriberStatus | '' } = {}) {
  const res = await api.get('/newsletter/cms/subscribers', { params });
  return unwrap<PaginatedOffset<NewsletterSubscriber>>(res);
}

export async function fetchNewsletterStats() {
  const res = await api.get('/newsletter/cms/stats');
  return unwrap<NewsletterStats>(res);
}

export interface SponsorSlotFormValues {
  sponsorId: string;
  headline: string;
  body: string;
  url: string;
  issueDate: string;
  isActive?: boolean;
}

export async function listSponsorSlots() {
  const res = await api.get('/newsletter/cms/sponsor-slots');
  return unwrap<NewsletterSponsorSlot[]>(res);
}

export async function createSponsorSlot(values: SponsorSlotFormValues) {
  const res = await api.post('/newsletter/cms/sponsor-slots', values);
  return unwrap<NewsletterSponsorSlot>(res);
}

export async function updateSponsorSlot(id: string, values: Partial<SponsorSlotFormValues>) {
  const res = await api.patch(`/newsletter/cms/sponsor-slots/${id}`, values);
  return unwrap<NewsletterSponsorSlot>(res);
}

export async function deleteSponsorSlot(id: string) {
  const res = await api.delete(`/newsletter/cms/sponsor-slots/${id}`);
  return unwrap<{ success: boolean }>(res);
}

export async function sendSponsorSlotTest(id: string, email: string) {
  const res = await api.post(`/newsletter/cms/sponsor-slots/${id}/send-test`, { email });
  return unwrap<{ delivered: boolean }>(res);
}
