// src/http/practiceApi.js
import { $authHost } from './index';

// ✅ Дефолтные практики (можно расширять без изменения остального кода)
export const PRACTICES = [
  {
    slug: 'good-bad',
    title: 'Хорошо — Плохо',
    description: 'Совсем скоро..',
  },
];

// Удобная карта по slug (опционально, вдруг пригодится где-то ещё)
export const practiceMap = new Map(PRACTICES.map(p => [p.slug, p]));

// ===== HTTP API =====

export const listPractices = async () => {
  const { data } = await $authHost.get('/practice');
  return data;
};

export const getProgress = async () => {
  const { data } = await $authHost.get('/practice/progress');
  return data;
};

export const getTest = async (slug) => {
  const { data } = await $authHost.get(`/practice/${slug}/test`);
  return data;
};

export const submitTest = async (slug, answers) => {
  const { data } = await $authHost.post(`/practice/${slug}/submit`, { answers });
  return data;
};
