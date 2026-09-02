import { api, unwrap } from '../api';
import type { LearningPath } from '../types';

export interface ListLearningPathsParams {
  page?: number;
  limit?: number;
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface LearningPathsPage {
  items: LearningPath[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listLearningPaths(params: ListLearningPathsParams = {}) {
  const res = await api.get('/cms/learning-paths', { params });
  return unwrap<LearningPathsPage>(res);
}

export async function fetchLearningPath(id: string) {
  const res = await api.get(`/cms/learning-paths/${id}`);
  return unwrap<LearningPath>(res);
}

export interface LearningPathItemInput {
  resourceId: string;
  note?: string;
}

export interface LearningPathFormValues {
  title: string;
  description?: string;
  coverImageUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  order?: number;
  /** Ordered list of DeveloperResource steps — array order is the walk-through order. */
  items: LearningPathItemInput[];
}

export async function createLearningPath(values: LearningPathFormValues) {
  const res = await api.post('/cms/learning-paths', values);
  return unwrap<LearningPath>(res);
}

export async function updateLearningPath(id: string, values: Partial<LearningPathFormValues>) {
  const res = await api.patch(`/cms/learning-paths/${id}`, values);
  return unwrap<LearningPath>(res);
}

export async function deleteLearningPath(id: string) {
  const res = await api.delete(`/cms/learning-paths/${id}`);
  return unwrap<{ message: string }>(res);
}
