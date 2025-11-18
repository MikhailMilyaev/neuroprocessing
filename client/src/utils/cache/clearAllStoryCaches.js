import { ns } from '../ns';

const LS_EXACT_KEYS = [
  ns('stories:index'),
  ns('ideas:inbox'),
  ns('ideas:stories'),
  ns('practice_runs:index'),
];

const LS_PREFIXES = [
  ns('story:snap:'),        
  ns('story:seen:'),        
  ns('story:dirty:'),      
  ns('story_viewY_local_'),  
];

const SS_PREFIXES = [
  ns('story_history_'),
  ns('story_pointer_'),
  ns('story_viewY_'),
  ns('story:seen:'),         
];

export function clearAllStoryCaches() {
  try {
    const ls = localStorage;
    const toRemove = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (!k) continue;

      const matchExact = LS_EXACT_KEYS.includes(k);
      const matchPrefix = LS_PREFIXES.some((prefix) => k.startsWith(prefix));

      if (matchExact || matchPrefix) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => ls.removeItem(k));
  } catch {}

  try {
    const ss = sessionStorage;
    const toRemove = [];
    for (let i = 0; i < ss.length; i++) {
      const k = ss.key(i);
      if (!k) continue;

      const matchPrefix = SS_PREFIXES.some((prefix) => k.startsWith(prefix));
      if (matchPrefix) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => ss.removeItem(k));
  } catch {}
}
