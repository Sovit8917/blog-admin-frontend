import { api, unwrap } from '../api';
import type { MediaItem, PaginatedOffset } from '../types';

export async function listMedia(page = 1, limit = 30) {
  const res = await api.get('/media', { params: { page, limit } });
  return unwrap<PaginatedOffset<MediaItem>>(res);
}

export async function uploadMedia(file: File, altText: string, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append('file', file);
  if (altText) form.append('altText', altText);
  const res = await api.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return unwrap<MediaItem>(res);
}

export async function deleteMedia(id: string) {
  const res = await api.delete(`/media/${id}`);
  return unwrap<{ message: string }>(res);
}
