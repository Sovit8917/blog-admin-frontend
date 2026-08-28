import { api, unwrap } from '../api';

/** GET /cms/settings resolves to a flat { [key]: value } map (defaults merged with stored rows). */
export type SettingsMap = Record<string, any>;

export async function fetchAllSettings() {
  const res = await api.get('/cms/settings');
  return unwrap<SettingsMap>(res);
}

export async function upsertSetting(key: string, value: unknown, group: string) {
  const res = await api.post('/cms/settings', { key, value, group });
  return unwrap<{ key: string; value: unknown; group: string }>(res);
}
