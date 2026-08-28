import { api, unwrap } from '../api';
import type { NewsletterStats, NewsletterSubscriber, PaginatedOffset, SubscriberStatus } from '../types';

export async function listSubscribers(params: { page?: number; limit?: number; status?: SubscriberStatus | '' } = {}) {
  const res = await api.get('/newsletter/cms/subscribers', { params });
  return unwrap<PaginatedOffset<NewsletterSubscriber>>(res);
}

export async function fetchNewsletterStats() {
  const res = await api.get('/newsletter/cms/stats');
  return unwrap<NewsletterStats>(res);
}
