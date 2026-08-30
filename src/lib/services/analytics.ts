import { api, unwrap } from '../api';
import type { AnalyticsOverview, MostReadEntry, RecommendationStats, RevenueOverview } from '../types';

export async function fetchAnalyticsOverview(days = 30) {
  const res = await api.get('/cms/analytics/overview', { params: { days } });
  return unwrap<AnalyticsOverview>(res);
}

export async function fetchMostRead(days = 7, limit = 10) {
  const res = await api.get('/cms/analytics/most-read', { params: { days, limit } });
  return unwrap<MostReadEntry[]>(res);
}

export async function fetchRecommendationStats(days = 30) {
  const res = await api.get('/cms/analytics/recommendations', { params: { days } });
  return unwrap<RecommendationStats>(res);
}

export async function fetchRevenueOverview() {
  const res = await api.get('/cms/analytics/revenue');
  return unwrap<RevenueOverview>(res);
}
