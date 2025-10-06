import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ns } from '../../utils/ns';
import { subscribe, getActorChannel, startRealtime } from '../../utils/realtime';
import StoriesHeader from '../../components/Stories/StoriesHeader/StoriesHeader';
import StoriesList from '../../components/Stories/StoriesList/StoriesList';
import FullScreenLoader from '../../components/FullScreenLoader/FullScreenLoader';
import Toast from '../../components/Toast/Toast';

import classes from './Stories.module.css';
import { STORY_ROUTE } from '../../utils/consts';
import { fetchStories, createStory, removeStory } from '../../http/storyApi';
import { readStoriesIndex, writeStoriesIndex, removeFromStoriesIndex } from '../../utils/cache/storiesCache';
import { useSmartDelay } from '../../hooks/useSmartDelay';
import { markSeenThisSession, writeSnapshot, purgeStoryLocal } from '../../utils/cache/storySnapshot';

const ARCHIVE_KEY = () => ns('showArchive');
const ACTIVE_HIGHLIGHT_KEY = () => ns('stories_active_highlight');

const getTs = (s) => {
  const v = s?.updatedAt ?? s?.updated_at ?? s?.createdAt ?? s?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a, b) => getTs(b) - getTs(a));
const mapForIndex = ({ id, slug, title, archive, updatedAt, updated_at, reevalDueAt, reeval_due_at }) => ({
  id, slug, title, archive,
  updatedAt: updatedAt ?? updated_at,
  reevalDueAt: reevalDueAt ?? reeval_due_at ?? null,
});

const warmStoryChunk = (() => {
  let started = false;
  return () => {
    if (started) return;
    started = true;
    import('../Story/Story');
    import('../../components/Story/StoryText/StoryText');
    import('../../components/Story/StoryIdeas/IdeaList/IdeaList');
  };
})();

/** var под нижнюю навигацию */
function useBottomNavHeightVar(varName = '--bottom-nav-h') {
  useEffect(() => {
    const setH = () => {
      const nav = document.querySelector('nav[aria-label="Основная навигация"]');
      const h = nav ? nav.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty(varName, `${h}px`);
    };
    setH();
    const ro = ('ResizeObserver' in window) ? new ResizeObserver(setH) : null;
    const nav = document.querySelector('nav[aria-label="Основная навигация"]');
    nav && ro?.observe(nav);
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', setH);
    return () => {
      window.removeEventListener('resize', setH);
      window.removeEventListener('orientationchange', setH);
      ro?.disconnect();
    };
  }, [varName]);
}

/** var под высоту хедера */
function useHeaderHeightVar(headerRef, varName = '--stories-header-h') {
  useEffect(() => {
    if (!headerRef.current) return;
    const setH = () => {
      const h = headerRef.current?.getBoundingClientRect?.().height || 0;
      document.documentElement.style.setProperty(varName, `${h}px`);
    };
    setH();
    const ro = ('ResizeObserver' in window) ? new ResizeObserver(setH) : null;
    headerRef.current && ro?.observe(headerRef.current);
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', setH);
    return () => {
      window.removeEventListener('resize', setH);
      window.removeEventListener('orientationchange', setH);
      ro?.disconnect();
    };
  }, [headerRef, varName]);
}

const Stories = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [storiesList, setStoriesList] = useState(() => sortByUpdated(readStoriesIndex()));
  const [isLoading, setIsLoading] = useState(true);

  const [showArchive, setShowArchive] = useState(() => {
    const state = location.state || {};
    if (state.archivedId) return true;
    if (state.activeId) return false;
    const saved = localStorage.getItem(ARCHIVE_KEY());
    return saved === 'true';
  });

  const [archiveLoaded, setArchiveLoaded] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [toastKey, setToastKey] = useState(0);

  const [creating, setCreating] = useState(false);

  const [pendingArchivedId, setPendingArchivedId] = useState(null);
  const [pendingActiveId, setPendingActiveId] = useState(null);

  const net = navigator.connection?.effectiveType || '';
  const saveData = navigator.connection?.saveData || false;
  const isSlow = /(^2g|3g)/i.test(net);

  const headerRef = useRef(null);
  useBottomNavHeightVar('--bottom-nav-h');
  useHeaderHeightVar(headerRef, '--stories-header-h');

  useEffect(() => {
    if (saveData) return;
    if (isSlow) return;
    const run = () => warmStoryChunk();
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    } else {
      const t = setTimeout(run, 250);
      return () => clearTimeout(t);
    }
  }, [isSlow, saveData]);

  const showCreateOverlay = useSmartDelay(creating, {
    delayIn: isSlow ? 200 : 300,
    minVisible: isSlow ? 800 : 500,
  });

  useEffect(() => {
    const state = location.state || {};

    if (state.toast?.text) {
      setToastMsg(state.toast.text);
      setToastType(state.toast.type || 'success');
      setToastKey((k) => k + 1);
    }

    if (state.archivedId) {
      setPendingArchivedId(Number(state.archivedId));
      setShowArchive(true);
      localStorage.setItem(ARCHIVE_KEY(), 'true');
      setSearchInput('');
    }

    if (state.activeId) {
      setPendingActiveId(Number(state.activeId));
      setShowArchive(false);
      localStorage.setItem(ARCHIVE_KEY(), 'false');
      setSearchInput('');
    } else {
      try {
        const v = sessionStorage.getItem(ACTIVE_HIGHLIGHT_KEY());
        if (v) {
          setPendingActiveId(Number(v));
          setShowArchive(false);
          localStorage.setItem(ARCHIVE_KEY(), 'false');
          setSearchInput('');
          sessionStorage.removeItem(ACTIVE_HIGHLIGHT_KEY());
        }
      } catch {}
    }

    if (state.toast || state.archivedId || state.activeId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchStories({
      archive: false,
      limit: 200,
      fields: 'id,slug,title,archive,updatedAt,reevalDueAt',
    })
      .then((server) => {
        if (cancelled) return;

        const serverArr = Array.isArray(server) ? server : (server?.rows || []);
        const serverIds = new Set(serverArr.map(s => Number(s.id)));
        const cached = readStoriesIndex();

        const cleaned = (cached || []).filter(it =>
          it.archive === true || serverIds.has(Number(it.id))
        );

        const byId = new Map(cleaned.map(i => [Number(i.id), i]));
        for (const s of serverArr) {
          const prev = byId.get(Number(s.id));
          if (!prev) {
            byId.set(Number(s.id), s);
          } else {
            const tS = Date.parse(s.updatedAt ?? s.updated_at ?? 0) || 0;
            const tP = Date.parse(prev.updatedAt ?? prev.updated_at ?? 0) || 0;
            byId.set(Number(s.id), (tP >= tS && prev.title && prev.title.trim())
              ? { ...s, title: prev.title }
              : s
            );
          }
        }

        const union = Array.from(byId.values());
        const sorted = sortByUpdated(union);
        setStoriesList(sorted);
        writeStoriesIndex(sorted.map(mapForIndex));
      })
      .catch((e) => {
        console.error('[fetchStories active]', e);
        setStoriesList(sortByUpdated(readStoriesIndex()));
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!showArchive || archiveLoaded) return;

    let cancelled = false;

    fetchStories({
      archive: true,
      limit: 200,
      fields: 'id,slug,title,archive,updatedAt,reevalDueAt',
    })
      .then((server) => {
        if (cancelled) return;

        const serverArr = Array.isArray(server) ? server : (server?.rows || []);
        const serverIds = new Set(serverArr.map(s => Number(s.id)));
        const current = storiesList;

        const cleaned = (current || []).filter(it =>
          it.archive === false || serverIds.has(Number(it.id))
        );

        const byId = new Map(cleaned.map(i => [Number(i.id), i]));
        for (const s of serverArr) {
          const prev = byId.get(Number(s.id));
          if (!prev) {
            byId.set(Number(s.id), s);
          } else {
            const tS = Date.parse(s.updatedAt ?? s.updated_at ?? 0) || 0;
            const tP = Date.parse(prev.updatedAt ?? prev.updated_at ?? 0) || 0;
            byId.set(Number(s.id), (tP >= tS && prev.title && prev.title.trim())
              ? { ...s, title: prev.title }
              : s
            );
          }
        }

        const union = Array.from(byId.values());
        const sorted = sortByUpdated(union);
        setStoriesList(sorted);
        writeStoriesIndex(sorted.map(mapForIndex));
        setArchiveLoaded(true);
      })
      .catch((e) => console.error('[fetchStories archive]', e));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchive]);

  const flashTimerRef = useRef(null);
  const scrollAndFlash = useCallback((id) => {
    if (!id) return;

    const tryFind = () => {
      let el = document.querySelector(`[data-story-id="${id}"]`);
      if (!el) {
        const a = document.querySelector(`a[href$="/story/${id}"]`);
        if (a) el = a.closest('[data-story-card], .card, .storyCard, li, article, div') || a;
      }
      return el;
    };

    let el = tryFind();

    if (!el && searchInput) {
      setSearchInput('');
      setTimeout(() => {
        const el2 = tryFind();
        if (!el2) return;
        el2.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el2.classList.remove(classes.flashHighlight);
        // eslint-disable-next-line no-unused-expressions
        el2.offsetWidth;
        el2.classList.add(classes.flashHighlight);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => el2.classList.remove(classes.flashHighlight), 2000);
      }, 60);
      return;
    }

    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove(classes.flashHighlight);
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add(classes.flashHighlight);

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      el.classList.remove(classes.flashHighlight);
    }, 2000);
  }, [searchInput, setSearchInput]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingArchivedId) return;
    if (!archiveLoaded) return;

    const item = storiesList.find(s => Number(s.id) === Number(pendingArchivedId));
    if (!item) return;

    setTimeout(() => {
      scrollAndFlash(pendingArchivedId);
      setPendingArchivedId(null);
    }, 50);
  }, [pendingArchivedId, archiveLoaded, storiesList, scrollAndFlash]);

  useEffect(() => {
    if (!pendingActiveId || isLoading) return;

    const item = storiesList.find(s => Number(s.id) === Number(pendingActiveId));
    if (!item) {
      setPendingActiveId(null);
      return;
    }

    setTimeout(() => {
      scrollAndFlash(pendingActiveId);
      setPendingActiveId(null);
    }, 50);
  }, [pendingActiveId, storiesList, isLoading, scrollAndFlash]);

  const handleAddStory = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const story = await createStory({ title: '', content: '' });

      try { markSeenThisSession(String(story.id)); } catch {}
      try {
        writeSnapshot(String(story.id), {
          updatedAt: story?.updatedAt || new Date().toISOString(),
          archive: false,
          reevalDueAt: null,
          stopContentY: null,
          baselineContent: story?.content || '',
          reevalCount: 0,
          showArchiveSection: true,
          lastViewContentY: null,

          remindersEnabled: true,
          remindersFreqSec: 30,
          remindersIndex: 0,
          remindersPaused: false,

          title: story?.title || '',
          content: story?.content || '',
          ideas: [],
        });
      } catch {}

      setStoriesList(prev => {
        const next = sortByUpdated([story, ...(prev || [])]);
        writeStoriesIndex(next.map(mapForIndex));
        return next;
      });

      navigate(`${STORY_ROUTE}/${story.slug}`);
    } catch (e) {
      console.error(e);
      alert('Не удалось создать историю. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStory = async (id) => {
    const prev = storiesList;
    const next = sortByUpdated((prev || []).filter((s) => Number(s.id) !== Number(id)));
    setStoriesList(next);
    writeStoriesIndex(next.map(mapForIndex));

    try { purgeStoryLocal(String(id)); } catch {}
    try { removeFromStoriesIndex(Number(id)); } catch {}

    try {
      await removeStory(id);
    } catch (e) {
      const status = e?.response?.status || e?.status || 0;
      if (status === 404) return;

      console.error('[removeStory fail]', e);
      setStoriesList(prev);
      writeStoriesIndex(prev.map(mapForIndex));
    }
  };

  const handleToggleArchive = (val) => {
    setShowArchive(val);
    localStorage.setItem(ARCHIVE_KEY(), String(val));
  };

  const activeCount  = (storiesList || []).filter(s => !s.archive).length;
  const archiveCount = (storiesList || []).filter(s =>  s.archive).length;

  const hasSearchInSelectedTab = showArchive
    ? (archiveLoaded && archiveCount > 0)
    : (activeCount > 0);

  useEffect(() => {
    startRealtime();

    const actorCh = getActorChannel();
    if (!actorCh) return;

    const off = subscribe(actorCh, (msg) => {
      if (msg?.type === 'stories.index.patch' && msg?.storyId) {
        const storyIdNum = Number(msg.storyId);
        const patch = msg.patch || {};

        if (patch.deleted === true) {
          setStoriesList((prev) => {
            const next = sortByUpdated((prev || []).filter(s => Number(s.id) !== storyIdNum));
            writeStoriesIndex(next.map(mapForIndex));
            return next;
          });
          try { removeFromStoriesIndex?.(storyIdNum); } catch {}
          try { purgeStoryLocal?.(String(storyIdNum)); } catch {}

          setToastType('info');
          setToastMsg('История была удалена в другой вкладке');
          setToastKey((k) => k + 1);

          return;
        }

        setStoriesList((prev) => {
          const byId = new Map((prev || []).map(i => [Number(i.id), i]));
          const prevItem = byId.get(storyIdNum) || { id: storyIdNum };

          const nextItem = {
            ...prevItem,
            ...(patch.title        !== undefined ? { title: patch.title } : {}),
            ...(patch.archive      !== undefined ? { archive: !!patch.archive } : {}),
            ...(patch.slug         !== undefined ? { slug: patch.slug } : {}),
            ...(patch.reevalDueAt  !== undefined ? { reevalDueAt: patch.reevalDueAt ?? null } : {}),
            updatedAt: patch.updatedAt || new Date().toISOString(),
          };

          byId.set(storyIdNum, nextItem);
          const arr = Array.from(byId.values());
          const sorted = sortByUpdated(arr);
          writeStoriesIndex(sorted.map(mapForIndex));
          return sorted;
        });
        return;
      }

      if ((msg?.type === 'story.deleted' || msg?.type === 'story.removed') && msg?.storyId) {
        const storyIdNum = Number(msg.storyId);
        setStoriesList((prev) => {
          const next = sortByUpdated((prev || []).filter(s => Number(s.id) !== storyIdNum));
          writeStoriesIndex(next.map(mapForIndex));
          return next;
        });
        try { removeFromStoriesIndex?.(storyIdNum); } catch {}
        try { purgeStoryLocal?.(String(storyIdNum)); } catch {}
        return;
      }
    });

    return () => { off(); };
  }, []);

  return (
    <div className={classes.storiesViewport}>
      {showCreateOverlay && <FullScreenLoader />}

      {/* ПОМЕТКА: блокируем скролл по этому контейнеру в iOS-PWA */}
      <div ref={headerRef} className={classes.headerSticky} data-lock-scroll="true">
        <StoriesHeader
          showArchive={showArchive}
          onToggleArchive={handleToggleArchive}
          hasAnyStories={hasSearchInSelectedTab}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          onAddStory={handleAddStory}
        />
      </div>

      <div className={classes.scrollArea} role="region" aria-label="Список историй">
        <StoriesList
          searchInput={searchInput}
          storiesList={storiesList}
          isLoading={isLoading}
          onDeleteStory={handleDeleteStory}
          showArchive={showArchive}
          onAddStory={handleAddStory}
          onToggleArchive={handleToggleArchive}
        />
      </div>

      <Toast
        message={toastMsg}
        type={toastType || 'success'}
        duration={5000}
        version={toastKey}
        placement="bottom"
        onClose={() => setToastMsg('')}
      />
    </div>
  );
};

export default Stories;
