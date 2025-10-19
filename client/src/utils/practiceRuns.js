// src/utils/practiceRuns.js
const LS_KEY = 'practice_runs_v1';

const read = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const write = (arr) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr || [])); } catch {}
};

/** мягкий slug + encodeURIComponent */
export const slugifyIdea = (text = '') => {
  const s = String(text || '').trim().toLowerCase();
  const base = s
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9\-_. ]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return encodeURIComponent(base || 'idea');
};

/** список запусков (новые сверху) */
export const listRuns = () => {
  return read().slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

/** проверка существования запуска (нормализуем к encoded) */
export const hasRun = (practiceSlug, ideaTextOrSlug = '') => {
  const runs = read();
  const looksEncoded = /%[0-9A-Fa-f]{2}/.test(ideaTextOrSlug);
  const ideaSlug = looksEncoded ? ideaTextOrSlug : slugifyIdea(ideaTextOrSlug);
  return runs.some(r => r.practiceSlug === practiceSlug && r.ideaSlug === ideaSlug);
};

/** находим запуск по params роутера (params могут прийти decoded) */
export const getRunByParams = (practiceSlug, ideaSlugParam = '') => {
  const runs = read();

  // сформируем набор возможных представлений слага
  const variants = new Set();
  variants.add(ideaSlugParam);
  try { variants.add(decodeURIComponent(ideaSlugParam)); } catch {}
  try { variants.add(encodeURIComponent(ideaSlugParam)); } catch {}

  // если в набре есть decoded строка кириллицей — сразу добавим её encoded-вариант
  for (const v of Array.from(variants)) {
    try { variants.add(encodeURIComponent(v)); } catch {}
    try { variants.add(decodeURIComponent(v)); } catch {}
  }

  const found = runs.find(
    (r) => r.practiceSlug === practiceSlug && variants.has(r.ideaSlug)
  );
  return found || null;
};

/** создать запуск (если нет) — всегда хранит encoded ideaSlug */
export const createRunIfNeeded = (practiceSlug, ideaText) => {
  const runs = read();
  const ideaSlug = slugifyIdea(ideaText);
  const exists = runs.find(r => r.practiceSlug === practiceSlug && r.ideaSlug === ideaSlug);
  if (exists) return exists;

  const run = {
    id: `${practiceSlug}:${ideaSlug}`,
    practiceSlug,
    ideaSlug,               // encoded
    ideaText,               // оригинальный текст идеи
    createdAt: new Date().toISOString(),
    state: {},
  };
  runs.push(run);
  write(runs);
  return run;
};

export const touchRun = (id, patch = {}) => {
  const runs = read();
  const i = runs.findIndex(r => r.id === id);
  if (i === -1) return;
  runs[i] = {
    ...runs[i],
    state: { ...(runs[i].state || {}), ...(patch || {}) },
    updatedAt: new Date().toISOString(),
  };
  write(runs);
};
