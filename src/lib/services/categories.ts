import { api, unwrap } from '../api';
import type { Category } from '../types';

export async function listCategories(includeInactive = true) {
  const res = await api.get('/categories', { params: { includeInactive: String(includeInactive) } });
  return unwrap<Category[]>(res);
}

export interface CategoryFormValues {
  name: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
  order?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export async function createCategory(values: CategoryFormValues) {
  // isActive/order aren't accepted on create — the backend defaults them; set via update if needed.
  const { isActive, order, ...createable } = values;
  const res = await api.post('/categories', createable);
  return unwrap<Category>(res);
}

export async function updateCategory(id: string, values: Partial<CategoryFormValues>) {
  const res = await api.patch(`/categories/${id}`, values);
  return unwrap<Category>(res);
}

export async function deleteCategory(id: string) {
  const res = await api.delete(`/categories/${id}`);
  return unwrap<{ message: string }>(res);
}
