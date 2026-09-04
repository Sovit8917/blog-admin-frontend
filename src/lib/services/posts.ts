import { api, unwrap } from '../api';
import type { Post, PostStatus, PostType, DifficultyLevel } from '../types';

export interface ListPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PostStatus | '';
  category?: string;
  author?: string;
  postType?: PostType | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PostsPage {
  items: Post[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Backend returns { items, meta: { page, limit, total, totalPages } } (see
// PostsService.findAllForManagement / offsetMeta) — not flattened, so this
// must NOT be typed as PaginatedOffset<T>.
export async function listPosts(params: ListPostsParams) {
  const res = await api.get('/cms/posts', { params });
  return unwrap<PostsPage>(res);
}

export async function getPost(id: string) {
  const res = await api.get(`/cms/posts/${id}`);
  return unwrap<Post>(res);
}

export interface PostFormValues {
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  status?: PostStatus;
  postType?: PostType;
  scheduledAt?: string;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  /** Article -> Job linking (P1) — job ids the editor hand-picked for this article. */
  jobIds?: string[];
  /** Tech/Software/AI content details — only relevant when category is a tech topic. */
  techStack?: string[];
  difficultyLevel?: DifficultyLevel | '';
  githubUrl?: string;
  demoUrl?: string;
  aiModelsUsed?: string[];
  toolsUsed?: string[];
  prerequisites?: string;
}

export async function createPost(values: PostFormValues) {
  const res = await api.post('/cms/posts', values);
  return unwrap<Post>(res);
}

export async function updatePost(id: string, values: Partial<PostFormValues>) {
  const res = await api.patch(`/cms/posts/${id}`, values);
  return unwrap<Post>(res);
}

export async function deletePost(id: string) {
  const res = await api.delete(`/cms/posts/${id}`);
  return unwrap<{ message: string }>(res);
}

// ---- Approval workflow ----
export async function listPendingReviewPosts() {
  const res = await api.get('/cms/posts/pending-review');
  return unwrap<Post[]>(res);
}

export async function submitPostForReview(id: string) {
  const res = await api.post(`/cms/posts/${id}/submit`);
  return unwrap<Post>(res);
}

export async function approvePost(id: string) {
  const res = await api.post(`/cms/posts/${id}/approve`);
  return unwrap<Post>(res);
}

export async function rejectPost(id: string, reason: string) {
  const res = await api.post(`/cms/posts/${id}/reject`, { reason });
  return unwrap<Post>(res);
}

// ---- Bulk actions ----
export type PostBulkAction = 'publish' | 'archive' | 'draft' | 'delete' | 'approve' | 'reject';

export async function bulkPostAction(ids: string[], action: PostBulkAction, rejectionReason?: string) {
  const res = await api.post('/cms/posts/bulk', { ids, action, rejectionReason });
  return unwrap<{ updated: number }>(res);
}
