import { api, unwrap } from '../api';
import type { AuditLogEntry } from '../types';

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAuditLog(params: { page?: number; limit?: number; entityType?: string; action?: string; userId?: string } = {}) {
  const res = await api.get('/cms/audit-log', { params });
  return unwrap<AuditLogResponse>(res);
}
