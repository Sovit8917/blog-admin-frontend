import { api, unwrap } from '../api';
import type { EmployerRequest, EmployerRequestStatus, PaginatedOffset } from '../types';

export interface ListEmployerRequestsParams {
  page?: number;
  limit?: number;
  status?: EmployerRequestStatus | '';
}

export async function listEmployerRequests(params: ListEmployerRequestsParams = {}) {
  const res = await api.get('/admin/employer-requests', {
    params: { ...params, status: params.status || undefined },
  });
  return unwrap<PaginatedOffset<EmployerRequest>>(res);
}

export async function approveEmployerRequest(id: string, reviewNote?: string) {
  const res = await api.patch(`/admin/employer-requests/${id}/approve`, { reviewNote });
  return unwrap<EmployerRequest>(res);
}

export async function rejectEmployerRequest(id: string, reviewNote?: string) {
  const res = await api.patch(`/admin/employer-requests/${id}/reject`, { reviewNote });
  return unwrap<EmployerRequest>(res);
}
