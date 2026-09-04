import { api, unwrap } from '../api';

export interface OwnProfile {
  id: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
}

export interface UpdateProfileValues {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

/** GET /me/profile — the logged-in user's own public profile fields. */
export async function getOwnProfile() {
  const res = await api.get('/me/profile');
  return unwrap<OwnProfile>(res);
}

/** PATCH /me/profile — update the logged-in user's own name/bio/avatar. */
export async function updateOwnProfile(values: UpdateProfileValues) {
  const res = await api.patch('/me/profile', values);
  return unwrap<OwnProfile>(res);
}
