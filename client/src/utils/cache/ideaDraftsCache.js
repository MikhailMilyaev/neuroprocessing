import { ns } from '../ns';

const INBOX_KEY = () => ns('ideas:inbox');
const STORIES_KEY = () => ns('ideas:stories');

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

export function readIdeaDraftsInbox() {
  try {
    const raw = localStorage.getItem(INBOX_KEY());
    const arr = safeParse(raw);
    if (!Array.isArray(arr)) return [];

    return arr.map(it => ({
      id: typeof it.id === 'number' ? it.id : Number(it.id) || 0,
      text: typeof it.text === 'string' ? it.text : '',
      sortOrder: typeof it.sortOrder === 'number' ? it.sortOrder : 0,
      uiKey: it.uiKey ?? it.id,
    }));
  } catch {
    return [];
  }
}

export function writeIdeaDraftsInbox(list) {
  try {
    const payload = (Array.isArray(list) ? list : []).map(it => ({
      id: it.id,
      text: it.text ?? '',
      sortOrder: typeof it.sortOrder === 'number' ? it.sortOrder : 0,
    }));
    localStorage.setItem(INBOX_KEY(), JSON.stringify(payload));
  } catch {}
}

export function readIdeaDraftsStories() {
  try {
    const raw = localStorage.getItem(STORIES_KEY());
    const obj = safeParse(raw);
    if (!obj || typeof obj !== 'object') {
      return { active: [], archive: [] };
    }
    const active = Array.isArray(obj.active) ? obj.active : [];
    const archive = Array.isArray(obj.archive) ? obj.archive : [];
    return { active, archive };
  } catch {
    return { active: [], archive: [] };
  }
}

export function writeIdeaDraftsStories(stories) {
  try {
    const payload = {
      active: Array.isArray(stories?.active) ? stories.active : [],
      archive: Array.isArray(stories?.archive) ? stories.archive : [],
    };
    localStorage.setItem(STORIES_KEY(), JSON.stringify(payload));
  } catch {}
}
