import { ns } from '../ns';

const KEY = () => ns('stories:index');

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

export function readStoriesIndex() {
  try {
    const raw = localStorage.getItem(KEY());
    const arr = safeParse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(x => ({
      id: x.id,
      title: typeof x.title === 'string' ? x.title : '',
      archive: !!x.archive,
      updatedAt: x.updatedAt ?? null,
      reevalDueAt: x.reevalDueAt ?? x.reeval_due_at ?? null,
    }));
  } catch {
    return [];
  }
}

export function writeStoriesIndex(list) {
  try {
    const payload = (Array.isArray(list) ? list : []).map(s => ({
      id: s.id,
      title: s.title ?? '',
      archive: !!s.archive,
      updatedAt: s.updatedAt ?? null,
      reevalDueAt: s.reevalDueAt ?? s.reeval_due_at ?? null,
    }));
    localStorage.setItem(KEY(), JSON.stringify(payload));
  } catch {}
}

export function patchStoriesIndex(id, patch = {}) {
  try {
    const raw = localStorage.getItem(KEY());
    const parsed = safeParse(raw);
    const arr = Array.isArray(parsed) ? parsed : [];

    let found = false;
    const updated = arr.map(it => {
      if (Number(it.id) === Number(id)) {
        found = true;
        return {
          ...it,
          ...patch,
          updatedAt: patch.updatedAt ?? it.updatedAt ?? new Date().toISOString(),
          reevalDueAt: (patch.reevalDueAt ?? patch.reeval_due_at ?? it.reevalDueAt ?? it.reeval_due_at ?? null),
        };
      }
      return it;
    });

    if (!found) {
      updated.unshift({
        id,
        title: patch.title ?? '',
        archive: !!patch.archive,
        updatedAt: patch.updatedAt ?? new Date().toISOString(),
        reevalDueAt: patch.reevalDueAt ?? patch.reeval_due_at ?? null,
      });
    }

    localStorage.setItem(KEY(), JSON.stringify(updated));
  } catch {}
}
