import { api, unwrap } from '../api';
import type { AnalyticsOverview } from '../types';

export async function fetchAnalyticsOverview(days = 30) {
  const res = await api.get('/cms/analytics/overview', { params: { days } });
  return unwrap<AnalyticsOverview>(res);
}
