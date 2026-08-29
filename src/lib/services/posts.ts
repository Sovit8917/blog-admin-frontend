import { api, unwrap } from '../api';
import type { Post, PostStatus, PostType, PaginatedOffset } from '../types';

export interface ListPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PostStatus | '';
  category?: string;
  author?: string;
  postType?: PostType | '';
}

export async function listPosts(params: ListPostsParams) {
  const res = await api.get('/cms/posts', { params });
  return unwrap<PaginatedOffset<Post>>(res);
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
