// src/http/practiceRunsApi.js
import { $authHost } from './index';

const API = '/practice-runs';

// тот же slug, что на сервере/старом localStorage-адаптере
export const slugifyIdea = (text = '') => {
  const s = String(text || '').trim().toLowerCase();
  const base = s
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9\-_. ]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return encodeURIComponent(base || 'idea');
};

// список моих запусков (новые сверху приходят с сервера)
export async function listRuns() {
  const { data } = await $authHost.get(API);
  return data;
}

// создать (идемпотентно вернёт существующий)
export async function createRunIfNeeded(practiceSlug, ideaText) {
  const { data } = await $authHost.post(API, { practiceSlug, ideaText });
  return data;
}

// частичный апдейт state (мердж на сервере)
export async function touchRun(id, patch = {}) {
  const { data } = await $authHost.patch(`${API}/${id}`, { state: patch });
  return data;
}

// удалить запуск по id
export async function deleteRun(id) {
  const { data } = await $authHost.delete(`${API}/${id}`);
  return data; // { ok: true }
}

// найти запуск по (practiceSlug, ideaSlugParam) среди своих
export async function getRunByParams(practiceSlug, ideaSlugParam = '') {
  const all = await listRuns();
  if (!Array.isArray(all)) return null;

  const variants = new Set([ideaSlugParam]);
  try { variants.add(decodeURIComponent(ideaSlugParam)); } catch {}
  try { variants.add(encodeURIComponent(ideaSlugParam)); } catch {}
  for (const v of Array.from(variants)) {
    try { variants.add(encodeURIComponent(v)); } catch {}
    try { variants.add(decodeURIComponent(v)); } catch {}
  }

  return all.find(r => r.practiceSlug === practiceSlug && variants.has(r.ideaSlug)) || null;
}
