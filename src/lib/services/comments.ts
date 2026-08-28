import { api, unwrap } from '../api';
import type { Comment, CommentStatus } from '../types';

export interface CommentsPage {
  items: Comment[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listCommentsForModeration(status: CommentStatus | '', page = 1, limit = 20) {
  const res = await api.get('/cms/comments', { params: { status: status || undefined, page, limit } });
  return unwrap<CommentsPage>(res);
}

export async function moderateComment(id: string, status: CommentStatus) {
  const res = await api.patch(`/cms/comments/${id}/moderate`, { status });
  return unwrap<Comment>(res);
}

export async function deleteComment(id: string) {
  const res = await api.delete(`/comments/${id}`);
  return unwrap<{ message: string }>(res);
}
