import { api, unwrap } from '../api';
import type { DashboardStats } from '../types';

export async function fetchDashboard() {
  const res = await api.get('/admin/dashboard');
  return unwrap<DashboardStats>(res);
}
