import { ns } from '../ns';

const SNAP_KEY  = (id) => ns(`story:snap:${id}`);
const SEEN_KEY  = (id) => ns(`story:seen:${id}`);
const DIRTY_KEY = (id) => ns(`story:dirty:${id}`);

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

export function readSnapshot(id) {
  try {
    const raw = localStorage.getItem(SNAP_KEY(id));
    if (!raw) return null;
    return safeParse(raw);
  } catch { return null; }
}

export function writeSnapshot(id, snap) {
  try {
    const prev = readSnapshot(id) || {};
    const payload = {
      ...prev,
      id,
      updatedAt: snap?.updatedAt || new Date().toISOString(),
      stopContentY:       snap?.stopContentY       ?? prev.stopContentY       ?? null,
      lastViewContentY:   snap?.lastViewContentY   ?? prev.lastViewContentY   ?? null,
      content:            (snap?.content ?? prev.content ?? ''),
      baselineContent:    snap?.baselineContent    ?? prev.baselineContent    ?? '',
      reevalCount:        snap?.reevalCount        ?? prev.reevalCount        ?? 0,
      showArchiveSection: snap?.showArchiveSection ?? prev.showArchiveSection ?? true,
      remindersEnabled:   snap?.remindersEnabled   ?? prev.remindersEnabled   ?? false,
      remindersFreqSec:   snap?.remindersFreqSec   ?? prev.remindersFreqSec   ?? 30,
      remindersIndex:     snap?.remindersIndex     ?? prev.remindersIndex     ?? 0,
      remindersPaused:    snap?.remindersPaused    ?? prev.remindersPaused    ?? false,
      archive:               (snap?.archive               !== undefined ? snap.archive               : (prev.archive ?? false)),
      reevalDueAt:           (snap?.reevalDueAt           !== undefined ? snap.reevalDueAt           : (prev.reevalDueAt ?? null)),
      rereviewToken:         (snap?.rereviewToken         !== undefined ? snap.rereviewToken         : (prev.rereviewToken ?? null)),
      rereviewStartedRound:  (snap?.rereviewStartedRound  !== undefined ? snap.rereviewStartedRound  : (prev.rereviewStartedRound ?? null)),

      title:   snap?.title   ?? prev.title   ?? '',

      ideas: Array.isArray(snap?.ideas)
        ? snap.ideas.map(i => ({
            id: i.id,
            text: i.text ?? '',
            score: i.score ?? null,
            introducedRound: i.introducedRound ?? 0,
            sortOrder: i.sortOrder ?? 0,
            ...(typeof i.srcStart === 'number' && typeof i.srcEnd === 'number'
              ? { srcStart: i.srcStart, srcEnd: i.srcEnd }
              : {}),
          }))
        : (Array.isArray(prev.ideas) ? prev.ideas : []),
    };

    localStorage.setItem(SNAP_KEY(id), JSON.stringify(payload));
    return payload;
  } catch { return null; }
}

export function markSeenThisSession(id) {
  try { sessionStorage.setItem(SEEN_KEY(id), '1'); } catch {}
}
export function isSeenThisSession(id) {
  try { return sessionStorage.getItem(SEEN_KEY(id)) === '1'; } catch { return false; }
}

export function markStoryDirty(id)   { try { localStorage.setItem(DIRTY_KEY(id), '1'); } catch {} }
export function clearStoryDirty(id)  { try { localStorage.removeItem(DIRTY_KEY(id)); } catch {} }
export function isStoryDirty(id)     { try { return localStorage.getItem(DIRTY_KEY(id)) === '1'; } catch { return false; } }


export function purgeStoryLocal(id) {
  try { localStorage.removeItem(SNAP_KEY(id)); } catch {}
  try { localStorage.removeItem(DIRTY_KEY(id)); } catch {}
  try { sessionStorage.removeItem(SEEN_KEY(id)); } catch {}

  try { localStorage.removeItem(ns(`story_viewY_local_${id}`)); } catch {}
  try { sessionStorage.removeItem(ns(`story_viewY_${id}`)); } catch {}
  try { sessionStorage.removeItem(ns(`story_history_${id}`)); } catch {}
  try { sessionStorage.removeItem(ns(`story_pointer_${id}`)); } catch {}
}
