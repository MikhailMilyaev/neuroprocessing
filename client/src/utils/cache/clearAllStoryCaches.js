export function clearAllStoryCaches() {
  // localStorage
  try {
    const ls = localStorage;
    const toRemove = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (!k) continue;
      if (
        k === 'stories:index' ||
        k === 'stories:snapshot' ||
        k === 'stories:seen' ||
        k.startsWith('story:snap:') ||
        k.startsWith('story:seen:') ||
        k.startsWith('story_viewY_local_')
      ) toRemove.push(k);
    }
    toRemove.forEach(k => ls.removeItem(k));
  } catch {}

  // sessionStorage
  try {
    const ss = sessionStorage;
    const toRemove = [];
    for (let i = 0; i < ss.length; i++) {
      const k = ss.key(i);
      if (!k) continue;
      if (
        k.startsWith('story_history_') ||
        k.startsWith('story_pointer_') ||
        k.startsWith('story_viewY_') ||
        k === 'stories:seen'
      ) toRemove.push(k);
    }
    toRemove.forEach(k => ss.removeItem(k));
  } catch {}
}
