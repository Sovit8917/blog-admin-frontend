import { api, unwrap } from '../api';
import type { Skill } from '../types';

export async function listSkills() {
  const res = await api.get('/skills');
  return unwrap<Skill[]>(res);
}

export async function createSkill(name: string) {
  const res = await api.post('/skills', { name });
  return unwrap<Skill>(res);
}

export async function deleteSkill(id: string) {
  const res = await api.delete(`/skills/${id}`);
  return unwrap<{ message: string }>(res);
}
