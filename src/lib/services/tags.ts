import { api, unwrap } from '../api';
import type { Tag } from '../types';

export async function listTags() {
  const res = await api.get('/tags');
  return unwrap<Tag[]>(res);
}

export async function createTag(name: string) {
  const res = await api.post('/tags', { name });
  return unwrap<Tag>(res);
}

export async function deleteTag(id: string) {
  const res = await api.delete(`/tags/${id}`);
  return unwrap<{ message: string }>(res);
}
