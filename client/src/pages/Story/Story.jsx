import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStoryBySlug, fetchStory, updateStory, reevaluateStory, beginRereview } from '../../http/storyApi';
import { listStoryIdeas, createStoryIdea, updateStoryIdea, deleteStoryIdea, reorderStoryIdeas } from '../../http/storyIdeasApi';
import { ns } from '../../utils/ns';
import { subscribe, getActorChannel, startRealtime } from '../../utils/realtime';
import { genOpId, markSentOp, isOwnOp } from '../../utils/opId';
import BackBtn from '../../components/BackBtn/BackBtn';
import StoryHeader from '../../components/Story/StoryHeader/StoryHeader';
import StoryMenu from '../../components/Story/StoryHeader/StoryMenu/StoryMenu';
import StoryText from '../../components/Story/StoryText/StoryText';
import IdeaList from '../../components/Story/StoryIdeas/IdeaList/IdeaList';
import Tips from '../../components/Story/StoryHeader/StoryMenu/Tips/Tips';  
import Spinner from '../../components/Spinner/Spinner';
import FullScreenLoader from '../../components/FullScreenLoader/FullScreenLoader';
import CompleteModal from '../../components/Story/CompleteModal/CompleteModal';
import Toast from '../../components/Toast/Toast';
import { PRACTICES } from '../../utils/practices';
import { readSnapshot, writeSnapshot, isSeenThisSession, markSeenThisSession, markStoryDirty, clearStoryDirty } from '../../utils/cache/storySnapshot';
import { patchStoriesIndex, removeFromStoriesIndex } from '../../utils/cache/storiesCache';
import { readStoriesIndex } from '../../utils/cache/storiesCache';
import { useSmartDelay } from '../../hooks/useSmartDelay';
import s from './Story.module.css';

const HK  = id => ns(`story_history_${id}`);
const PK  = id => ns(`story_pointer_${id}`);
const VK  = id => ns(`story_viewY_${id}`);
const VKL = id => ns(`story_viewY_local_${id}`);

const ARCHIVE_KEY = () => ns('showArchive');
const ACTIVE_HIGHLIGHT_KEY = () => ns('stories_active_highlight');
const SAVE_DEBOUNCE = 600;
const IDEA_DEBOUNCE = 600;
const HISTORY_MAX = 200;
const IDEA_CHAR_LIMIT = 80;

const ANIM_MS = 250;
const MOVE_AFTER_MS = Math.max(0, ANIM_MS - 10);

const SORT_KEY = (id) => ns(`story_sorted_${id}`);
const SORT_BASE_KEY = (id) => ns(`story_sorted_base_${id}`);

const parseFinite = v => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const pickInitialViewYFromStorages = (id, snap) => {
  try {
    const s = sessionStorage.getItem(VK(id));
    const fromSession = parseFinite(s);
    if (fromSession != null) return fromSession;
  } catch {}
  try {
    const l = localStorage.getItem(VKL(id));
    const fromLocal = parseFinite(l);
    if (fromLocal != null) return fromLocal;
  } catch {}
  const fromSnap = snap && parseFinite(snap.lastViewContentY);
  return fromSnap ?? null;
};

const mapIdeasToBeliefs = (ideas = []) =>
  ideas.map(i => ({
    id: i.id,
    uiKey: `i-${i.id}`,
    text: i.text || '',
    score: i.score == null ? '' : String(i.score),
    introducedRound: i.introducedRound ?? 0,
    sortOrder: Number.isFinite(i?.sortOrder) ? i.sortOrder : 0,
    ...(typeof i.srcStart === 'number' && typeof i.srcEnd === 'number' ? { srcStart: i.srcStart, srcEnd: i.srcEnd } : {}),
  }));

export default function Story() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const idFromIndex = useMemo(() => {
    const idx = readStoriesIndex();
    const item = (idx || []).find(s => s.slug === slug);
    return item?.id ?? null;
  }, [slug]);

  const [id, setId] = useState(idFromIndex);
  const initialSnap = id ? readSnapshot(id) : null;
  if (id && initialSnap && (initialSnap.reevalCount ?? 0) > 0) {
    const hasZeroes = Array.isArray(initialSnap.ideas) && initialSnap.ideas.some(i => i?.score === 0);
    if (hasZeroes) {
      writeSnapshot(id, { ...initialSnap, ideas: (initialSnap.ideas || []).map(i => ({ ...i, score: null })) });
    }
  }

  const canTrustCache = !!(id && initialSnap);

  const [history, setHistory] = useState(() => {
    if (canTrustCache) {
      const beliefs = mapIdeasToBeliefs(initialSnap.ideas || []);
      return [{ title: initialSnap.title || '', content: initialSnap.content || '', beliefs }];
    }
    return [{ title: '', content: '', beliefs: [] }];
  });
  const [pointer, setPointer] = useState(0);
  const [showBelief, setShowBelief] = useState(false);

  const editingFromArchiveRef = useRef(new Set());
  const userTouchedRef = useRef(false);

  const saveTimerRef = useRef(null);
  const lastStoryPayloadRef = useRef(null);

  const ideaTimersRef = useRef(new Map());
  const ideaPendingRef = useRef(new Map());

  const moveTimersRef = useRef(new Map());
  const snapTimerRef = useRef(null);

  const creatingIdeaRef = useRef(new Map());
  const latestIdeaTextRef = useRef(new Map());
  const deleteAfterCreateRef = useRef(new Set());

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: '0px', y: '0px' });

  const [remindersOn, setRemindersOn] = useState(null);
  const [reminderFreqSec, setReminderFreqSec] = useState(30);
  const [reminderPaused, setReminderPaused] = useState(false);
  const [reminderIdx, setReminderIdx] = useState(0);

  const [archiveOn, setArchiveOn] = useState(true);
  const [initialViewY, setInitialViewY] = useState(() => (canTrustCache ? pickInitialViewYFromStorages(id, initialSnap) : null));

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastKey, setToastKey] = useState(0);
  const showError = msg => { setToastMsg(msg); setToastType('error'); setToastKey(k => k + 1); };

  const [sortedView, setSortedView] = useState(false);
  const vkRef = useRef(null);
  const contentRef = useRef(null); // <— СКРОЛЛ-КОНТЕЙНЕР ДЛЯ МОБИЛЬНОГО

  useEffect(() => {
    if (!id) return;
    try {
      const v = localStorage.getItem(SORT_KEY(id));
      if (v === '1') setSortedView(true);
      if (v === '0') setSortedView(false);
    } catch {}
  }, [id]);

  const [unsortedOrder, setUnsortedOrder] = useState(null);

  const [stopY, setStopY] = useState(canTrustCache ? (initialSnap.stopContentY ?? null) : null);

  const [reevalRound, setReevalRound] = useState(canTrustCache ? (initialSnap.reevalCount ?? 0) : 0);
  const [baseline, setBaseline] = useState(canTrustCache ? (initialSnap.baselineContent ?? '') : '');

  const [ideasLoading, setIdeasLoading] = useState(!canTrustCache);
  const [showOverlay, setShowOverlay] = useState(false);

  const current = useMemo(() => history[pointer] ?? { title: '', content: '', beliefs: [] }, [history, pointer]);

  const [isArchivedStory, setIsArchivedStory] = useState(canTrustCache ? !!initialSnap.archive : false);

  const isArchived = b => b?.score !== '' && b?.score != null && Number(b.score) === 0;

  const areAllActiveScored = list => {
    const active = (list || []).filter(b => !isArchived(b));
    if (active.length === 0) return true;
    return active.every(b => {
      const v = b.score;
      if (v === '' || v == null) return false;
      const num = Number(v);
      return Number.isFinite(num) && num >= 1 && num <= 10;
    });
  };

  const sendStoryUpdate = async (patch) => {
    const opId = genOpId();
    markSentOp(opId);
    return updateStory(id, patch, { opId });
  };

  const sendCreateIdea = async (storyId, payload) => {
    const opId = genOpId();
    markSentOp(opId);
    return createStoryIdea(storyId, payload, { opId });
  };

  const sendIdeaUpdate = async (iid, payload) => {
    const opId = genOpId();
    markSentOp(opId);
    return updateStoryIdea(iid, payload, { opId });
  };

  const sendReorderIdeas = async (storyId, order) => {
    const opId = genOpId();
    markSentOp(opId);
    return reorderStoryIdeas(storyId, order, { opId });
  };

  const sendReevaluate = async (storyId) => {
    const opId = genOpId();
    markSentOp(opId);
    return reevaluateStory(storyId, { opId });
  };

  const openUnarchivedToast = () => {
    setToastType('info');
    setToastMsg('История стала активной');
    setToastKey(k => k + 1);
  };

  const [activeHighlight, setActiveHighlight] = useState(null);
  const hydratedFromCacheRef = useRef(canTrustCache);
  const [freezeAnimKey, setFreezeAnimKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const story = await fetchStoryBySlug(slug);
        if (cancelled) return;

        setId(story.id);

        const snap = readSnapshot(story.id);
        if (snap) {
          const beliefs = mapIdeasToBeliefs(snap.ideas || []);
          setHistory([{ title: snap.title || '', content: snap.content || '', beliefs }]);
          setPointer(0);
          setIsArchivedStory(!!snap.archive);
          setStopY(snap.stopContentY ?? null);
          setReevalRound(snap.reevalCount ?? 0);
          setBaseline(snap.baselineContent ?? '');
          setInitialViewY(pickInitialViewYFromStorages(story.id, snap));
          setIdeasLoading(false);
        }

        if (!snap && !isSeenThisSession(story.id)) setShowOverlay(true);
      } catch {
        navigate('/stories', { replace: true });
      } finally {
        if (!cancelled) {}
      }
    })();

    return () => { cancelled = true; };
  }, [slug, navigate]);

  useEffect(() => {
    if (!id) return;

    const onStorage = (e) => {
      if (e.key !== SORT_KEY(id)) return;

      const wantSorted = e.newValue === '1';
      setSortedView(wantSorted);

      const full = (history[pointer]?.beliefs || []);
      if (!full.length) return;

      const isArchivedFlag = (b) => b?.score !== '' && b?.score != null && Number(b?.score) === 0;

      if (wantSorted) {
        const active = full.filter(b => !isArchivedFlag(b));
        const archived = full.filter(isArchivedFlag);
        const activeSorted = active
          .map((b, idx) => ({ ...b, _idx: idx }))
          .sort((a, b) => Number(b.score) - Number(a.score) || a._idx - b._idx)
          .map(({ _idx, ...b }) => b);
        const nextBeliefs = [...activeSorted, ...archived];
        apply({ ...current, beliefs: nextBeliefs });

        try {
          const raw = localStorage.getItem(SORT_BASE_KEY(id));
          if (!raw) {
            localStorage.setItem(SORT_BASE_KEY(id), JSON.stringify(full.map(b => b.id)));
          }
        } catch {}
      } else {
        let base = [];
        try {
          base = JSON.parse(localStorage.getItem(SORT_BASE_KEY(id)) || '[]');
        } catch {}
        if (!Array.isArray(base) || base.length === 0) return;

        const pos = new Map(base.map((bid, i) => [bid, i]));
        const restored = full.slice().sort((a, b) =>
          (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity)
        );
        apply({ ...current, beliefs: restored });
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id, history, pointer, current]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const story = await fetchStory(id);
        if (cancelled) return;

        const doFreeze = hydratedFromCacheRef.current;

        const initialSnapLocal = readSnapshot(id);
        const localCanTrustCache = !!(id && initialSnapLocal);
        const snapToken = initialSnapLocal?.rereviewToken ?? null;
        const snapStartedRound = initialSnapLocal?.rereviewStartedRound ?? null;
        const dueToken = story?.reevalDueAt ?? null;

        let roundToUse = story?.reevalCount || 0;
        let startedFromArchive = false;

        const shouldStartRereview =
          !!story?.archive && (
            (dueToken && snapToken !== dueToken) ||
            (!dueToken && snapStartedRound !== roundToUse)
          );

        if (shouldStartRereview) {
          startedFromArchive = true;
          try {
            const { round } = await beginRereview(id);
            roundToUse = round || (roundToUse + 1);
          } catch {
            roundToUse = (roundToUse + 1);
          }
        }

        const ideasRaw = await listStoryIdeas(id).catch(() => []);
        if (cancelled) return;

        let beliefs = mapIdeasToBeliefs(ideasRaw);

        try {
          const wantSorted = localStorage.getItem(SORT_KEY(id)) === '1';
          if (wantSorted) {
            const isArchivedFlag = (b) => b?.score !== '' && b?.score != null && Number(b?.score) === 0;
            const active   = beliefs.filter(b => !isArchivedFlag(b));
            const archived = beliefs.filter(isArchivedFlag);
            const activeSorted = active
              .map((b, idx) => ({ ...b, _idx: idx }))
              .sort((a, b) => Number(b.score) - Number(a.score) || a._idx - b._idx)
              .map(({ _idx, ...b }) => b);
            beliefs = [...activeSorted, ...archived];
            setSortedView(true);
          }
        } catch {}

        const prevOrder = (initialSnapLocal?.ideas || []).map(i => i.id);
        const serverOrder = ideasRaw.map(i => i.id);
        const sameOrder =
          prevOrder.length === serverOrder.length &&
          prevOrder.every((v, i) => v === serverOrder[i]);

        setHistory([{ title: story?.title || '', content: story?.content || '', beliefs }]);

        setPointer(0);

        setIsArchivedStory(!!story?.archive);
        setStopY(story?.stopContentY ?? null);
        setReevalRound(roundToUse);
        setBaseline(story?.baselineContent ?? story?.content ?? '');

        setArchiveOn(story?.showArchiveSection ?? true);
        setRemindersOn(story?.remindersEnabled ?? false);
        setReminderFreqSec(story?.remindersFreqSec === undefined ? 30 : story?.remindersFreqSec);
        setReminderPaused(story?.remindersPaused ?? false);
        setReminderIdx(story?.remindersIndex ?? 0);

        setInitialViewY(v => {
          if (v != null) return v;
          const fromStorages = pickInitialViewYFromStorages(id, initialSnapLocal);
          const fromDb = parseFinite(story?.lastViewContentY);
          return fromStorages ?? fromDb ?? null;
        });

        const nextRereviewToken =
          shouldStartRereview
            ? (dueToken || `round:${roundToUse}`)
            : (snapToken ?? (dueToken || null));

        writeSnapshot(id, {
          updatedAt: story?.updatedAt || new Date().toISOString(),
          archive: !!story?.archive,
          reevalDueAt: story?.reevalDueAt ?? null,
          rereviewToken: nextRereviewToken,
          rereviewStartedRound: shouldStartRereview ? roundToUse : (Number.isFinite(snapStartedRound) ? snapStartedRound : null),
          stopContentY: story?.stopContentY ?? null,
          baselineContent: story?.baselineContent ?? '',
          reevalCount: roundToUse,
          showArchiveSection: story?.showArchiveSection ?? true,
          lastViewContentY: story?.lastViewContentY ?? null,
          remindersEnabled: story?.remindersEnabled ?? true,
          remindersFreqSec: story?.remindersFreqSec ?? 30,
          remindersIndex: story?.remindersIndex ?? 0,
          remindersPaused: story?.remindersPaused ?? false,
          title: story?.title ?? '',
          content: story?.content ?? '',
          ideas: ideasRaw,
        });

        patchStoriesIndex(Number(id), {
          id: Number(id),
          slug: story?.slug ?? '',
          title: story?.title ?? '',
          archive: !!story?.archive,
          updatedAt: story?.updatedAt ?? new Date().toISOString(),
          reevalDueAt: story?.reevalDueAt ?? null,
        });

        if (ideaPendingRef.current.size === 0) clearStoryDirty(id);

        markSeenThisSession(id);
        setShowOverlay(false);
        setIdeasLoading(false);

        if ((doFreeze || startedFromArchive || !localCanTrustCache) && !sameOrder) {
          setFreezeAnimKey(k => k + 1);
        }
        hydratedFromCacheRef.current = false;
      } catch {
        setShowOverlay(false);
        setIdeasLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const isIOSStandalone = useMemo(() => {
    const ua = navigator.userAgent || '';
    const isiOS = /iP(hone|ad|od)/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    return isiOS && standalone;
  }, []);

  // «пустая» история — нет идей (StoryText сам со своим скроллом)
  const isEmptyStory = (current.beliefs?.length ?? 0) === 0;

  // ЛОК СКРОЛЛА ДЛЯ PWA iOS, когда история пустая
  useEffect(() => {
    if (!isIOSStandalone) return;

    if (isEmptyStory) {
      const scrollY = window.scrollY || 0;
      document.documentElement.classList.add('ios-lock');
      document.body.classList.add('ios-lock');

      Object.assign(document.body.style, {
        position: 'fixed',
        top: `-${scrollY}px`,
        left: '0',
        right: '0',
        width: '100%',
        overflow: 'hidden',
      });

      return () => {
        const top = parseInt(document.body.style.top || '0', 10) || 0;
        document.body.removeAttribute('style');
        document.documentElement.classList.remove('ios-lock');
        document.body.classList.remove('ios-lock');
        window.scrollTo(0, Math.abs(top));
      };
    }
  }, [isIOSStandalone, isEmptyStory]);

  useEffect(() => {
    if (isIOSStandalone) {
      document.documentElement.classList.add('ios-standalone');
      return () => document.documentElement.classList.remove('ios-standalone');
    }
  }, [isIOSStandalone]);

  useEffect(() => {
    if (!id) return;

    startRealtime();

    const storyCh = `story:${id}`;
    const offStory = subscribe(storyCh, (msg) => {
      if (msg?.opId && isOwnOp(msg.opId)) return;
      if (Number(msg?.storyId) !== Number(id)) return;

      if (msg?.type === 'story.deleted') {
        removeFromStoriesIndex(Number(id));
        setToastType('success');
        setToastMsg('История удалена');
        setToastKey(k => k + 1);
        navigate('/stories', { replace: true });
        return;
      }

      if (msg?.type !== 'story.updated') return;

      const p = msg.patch || {};

      setHistory((prev) => {
        const last = prev[prev.length - 1] || { title: '', content: '', beliefs: [] };
        const next = {
          ...last,
          ...(p.title   !== undefined ? { title: p.title }     : {}),
          ...(p.content !== undefined ? { content: p.content } : {}),
        };
        const base = prev.slice(0, prev.length - 1);
        return [...base, next];
      });

      if (p.archive !== undefined) setIsArchivedStory(!!p.archive);
      if (p.baselineContent !== undefined) setBaseline(p.baselineContent ?? '');

      try {
        const prevSnap = readSnapshot(id) || {};
        writeSnapshot(id, {
          ...prevSnap,
          updatedAt: p.updatedAt || new Date().toISOString(),
          ...(p.title   !== undefined ? { title: p.title } : {}),
          ...(p.content !== undefined ? { content: p.content } : {}),
          ...(p.archive !== undefined ? { archive: !!p.archive } : {}),
          ...(p.reevalDueAt !== undefined ? { reevalDueAt: p.reevalDueAt ?? null } : {}),
        });
      } catch {}

      try {
        patchStoriesIndex(Number(id), {
          id: Number(id),
          ...(p.title   !== undefined ? { title: p.title } : {}),
          ...(p.archive !== undefined ? { archive: !!p.archive } : {}),
          ...(p.slug    !== undefined ? { slug: p.slug } : {}),
          ...(p.reevalDueAt !== undefined ? { reevalDueAt: p.reevalDueAt ?? null } : {}),
          updatedAt: p.updatedAt || new Date().toISOString(),
        });
      } catch {}

      if (p.slug && typeof p.slug === 'string') {
        const newUrl = `/story/${p.slug}`;
        if (window.location.pathname !== newUrl) {
          navigate(newUrl, { replace: true });
        }
      }
    });

    const actorCh = getActorChannel();
    const offActor = actorCh
      ? subscribe(actorCh, (msg) => {
          if (msg?.opId && isOwnOp(msg.opId)) return;
          if (msg?.type !== 'stories.index.patch' || Number(msg?.storyId) !== Number(id)) return;

          const p = msg.patch || {};
          try {
            if (p.deleted === true) {
              removeFromStoriesIndex(Number(id));
              setToastType('info');
              setToastMsg('История была удалена в другой вкладке');
              setToastKey(k => k + 1);
              navigate('/stories', { replace: true });
              return;
            }
            patchStoriesIndex(Number(id), {
              id: Number(id),
              ...(p.title   !== undefined ? { title: p.title } : {}),
              ...(p.archive !== undefined ? { archive: !!p.archive } : {}),
              ...(p.slug    !== undefined ? { slug: p.slug } : {}),
              ...(p.reevalDueAt !== undefined ? { reevalDueAt: p.reevalDueAt ?? null } : {}),
              updatedAt: p.updatedAt || new Date().toISOString(),
            });
          } catch {}
        })
      : () => {};

    const ideasCh = `story:${id}`;
    const offIdeas = subscribe(ideasCh, (msg) => {
      if (msg?.opId && isOwnOp(msg.opId)) return;
      if (!msg || Number(msg?.storyId) !== Number(id)) return;

      const patchBeliefs = (updater) => {
        setHistory((prev) => {
          const last = prev[prev.length - 1] || { title: '', content: '', beliefs: [] };
          const nextBeliefs = updater(last.beliefs || []);
          const base = prev.slice(0, prev.length - 1);
          return [...base, { ...last, beliefs: nextBeliefs }];
        });
      };

      switch (msg.type) {
        case 'idea.created': {
          const i = msg.payload;
          if (!i?.id) return;

          patchBeliefs((list) => {
            // если уже есть серверный id — ничего не делаем
            if (list.some(b => b.id === i.id)) return list;

            const norm = (t) => (t || '').trim();
            const serverText = norm(i.text);

            // если у нас уже есть локальная пустая/полупустая заготовка с тем же текстом — не дублируем
            const hasTempSame = list.some(b =>
              b.id < 0 && norm(b.text) === serverText
            );
            if (hasTempSame) return list;

            // обычное добавление: перед активными, перед архивом
            const b = mapIdeasToBeliefs([i])[0];
            const isArchived = (v) => v.score !== '' && v.score != null && Number(v.score) === 0;
            const active = list.filter(x => !isArchived(x));
            const archived = list.filter(isArchived);
            return [b, ...active, ...archived];
          });
          break;
        }

        case 'idea.updated': {
          const p = msg.patch || {};
          const iid = msg.ideaId;
          if (!iid) return;

          patchBeliefs((list) => {
            const idx = list.findIndex(b => b.id === iid);
            if (idx === -1) {
              return list.map(b => {
                if (b.id !== iid) return b;
                return {
                  ...b,
                  ...(p.text   !== undefined ? { text: p.text } : {}),
                  ...(p.score  !== undefined ? { score: p.score == null ? '' : String(p.score) } : {}),
                  ...(p.sortOrder !== undefined ? { sortOrder: p.sortOrder } : {}),
                  ...(typeof p.srcStart === 'number' && typeof p.srcEnd === 'number'
                      ? { srcStart: p.srcStart, srcEnd: p.srcEnd }
                      : {}),
                };
              });
            }

            const prevItem = list[idx];
            const wasArchived = prevItem.score !== '' && prevItem.score != null && Number(prevItem.score) === 0;

            const nextItem = {
              ...prevItem,
              ...(p.text   !== undefined ? { text: p.text } : {}),
              ...(p.score  !== undefined ? { score: p.score == null ? '' : String(p.score) } : {}),
              ...(p.sortOrder !== undefined ? { sortOrder: p.sortOrder } : {}),
              ...(typeof p.srcStart === 'number' && typeof p.srcEnd === 'number'
                  ? { srcStart: p.srcStart, srcEnd: p.srcEnd }
                  : {}),
            };

            const nowArchived = nextItem.score !== '' && nextItem.score != null && Number(nextItem.score) === 0;

            let next = list.slice();
            next[idx] = nextItem;

            if (wasArchived !== nowArchived) {
              const rest = next.filter(b => b.id !== iid);
              const isArch = (x) => x.score !== '' && x.score != null && Number(x.score) === 0;
              const active   = rest.filter(x => !isArch(x));
              const archived = rest.filter(isArch);
              next = nowArchived
                ? [...active, nextItem, ...archived]  
                : [nextItem, ...active, ...archived];  
            }

            return next;
          });
          break;
        }

        case 'idea.deleted': {
          const iid = msg.ideaId;
          if (!iid) return;
          patchBeliefs((list) => list.filter(b => b.id !== iid));
          break;
        }

        case 'idea.reordered': {
          const order = Array.isArray(msg.order) ? msg.order : [];
          if (!order.length) return;
          const pos = new Map(order.map((id, i) => [id, i]));
          patchBeliefs((list) =>
            list.slice().sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity))
          );
          break;
        }

        case 'reeval.completed': {
          setReevalRound((msg.round || 0));
          setHistory((prev) => {
            const last = prev[prev.length - 1] || { title: '', content: '', beliefs: [] };
            const nextBeliefs = (last.beliefs || []).map(b => {
              const isArchived = b.score !== '' && b.score != null && Number(b.score) === 0;
              return isArchived ? b : { ...b, score: '' };
            });
            const base = prev.slice(0, prev.length - 1);
            return [...base, { ...last, beliefs: nextBeliefs }];
          });

          try {
            const prevSnap = readSnapshot(id) || {};
            writeSnapshot(id, {
              ...prevSnap,
              reevalCount: (msg.round || prevSnap.reevalCount || 0),
              baselineContent: prevSnap.baselineContent ?? '',
              updatedAt: new Date().toISOString(),
            });
          } catch {}
          break;
        }

        case 'rereview.started': {
          setReevalRound((msg.round || 0));
          setIsArchivedStory(false);  
          setArchiveOn(true);     

          try {
            const prevSnap = readSnapshot(id) || {};
            writeSnapshot(id, {
              ...prevSnap,
              archive: false,
              reevalDueAt: null,
              reevalCount: (msg.round || prevSnap.reevalCount || 0),
              updatedAt: new Date().toISOString(),
            });
          } catch {}
          break;
        }

        default:
          break;
      }
    });

    return () => {
      offStory();
      offActor();
      offIdeas();
    };
  }, [id, navigate]);

  useEffect(() => {
    try {
      sessionStorage.setItem(HK(id), JSON.stringify(history));
      sessionStorage.setItem(PK(id), String(pointer));
    } catch {}
  }, [history, pointer, id]);

  useEffect(() => {
    const timersMap   = ideaTimersRef.current;
    const pendingMap  = ideaPendingRef.current;
    const moveTimers  = moveTimersRef.current;

    return () => {
      (async () => {
        const saveTimer   = saveTimerRef.current;
        const lastPayload = lastStoryPayloadRef.current;

        if (lastPayload) {
          try { await sendStoryUpdate(lastPayload); } catch {}
        }
        if (saveTimer) clearTimeout(saveTimer);
        lastStoryPayloadRef.current = null;

        if (snapTimerRef.current) clearTimeout(snapTimerRef.current);

        for (const [, t] of timersMap.entries()) clearTimeout(t);
        for (const [iid, payload] of pendingMap.entries()) {
          try { await sendIdeaUpdate(iid, payload); } catch {}
        }
        timersMap.clear();
        pendingMap.clear();

        for (const t of moveTimers.values()) clearTimeout(t);
        moveTimers.clear();
      })();
    };
  }, [id]);

  const flushPendingWrites = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const lastPayload = lastStoryPayloadRef.current;
    if (lastPayload) {
      try { await sendStoryUpdate(lastPayload) } catch {}
      lastStoryPayloadRef.current = null;
    }
    for (const t of ideaTimersRef.current.values()) clearTimeout(t);
    ideaTimersRef.current.clear();

    const pending = ideaPendingRef.current;
    if (pending.size) {
      const jobs = [];
      for (const [iid, payload] of pending.entries()) {
        jobs.push(sendIdeaUpdate(iid, payload))
      }
      await Promise.allSettled(jobs);
      pending.clear();
    }
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingWrites();
      }
    };

    const onBeforeUnload = () => {
      flushPendingWrites();
    };

    const onOffline = () => {
      flushPendingWrites();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('offline', onOffline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('offline', onOffline);
    };
  }, [id]);  

  const scheduleSave = (payload) => {
    lastStoryPayloadRef.current = { ...(lastStoryPayloadRef.current || {}), ...payload };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const p = lastStoryPayloadRef.current;
      if (p && id) {
        try {
          const saved = await sendStoryUpdate(p);
          if (saved?.slug && typeof saved.slug === 'string') {
            const newUrl = `/story/${saved.slug}`;
            if (window.location.pathname !== newUrl) {
              navigate(newUrl, { replace: true });
            }
          }
        } catch {}
        lastStoryPayloadRef.current = null;
      }
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE);
  };

  const scheduleSnapshot = (partial) => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(() => {
      writeSnapshot(id, {
        updatedAt: new Date().toISOString(),
        archive: !!isArchivedStory,
        reevalDueAt: undefined,
        rereviewToken: undefined,
        rereviewStartedRound: undefined,

        baselineContent: baseline ?? '',
        reevalCount: reevalRound ?? 0,
        showArchiveSection: archiveOn ?? true,
        lastViewContentY: null,

        remindersEnabled: remindersOn ?? false,
        remindersFreqSec: reminderFreqSec ?? 30,
        remindersIndex: reminderIdx ?? 0,
        remindersPaused: reminderPaused ?? false,

        title: (partial?.title ?? current.title) ?? '',
        content: (partial?.content ?? current.content) ?? '',
        ideas: (current.beliefs || []).map(b => ({
          id: b.id,
          text: b.text ?? '',
          score: b.score === '' ? null : Number(b.score),
          introducedRound: b.introducedRound ?? 0,
          sortOrder: Number.isFinite(b.sortOrder) ? b.sortOrder : 0,
          ...(typeof b.srcStart === 'number' && typeof b.srcEnd === 'number'
            ? { srcStart: b.srcStart, srcEnd: b.srcEnd }
            : {}),
        })),
      });
    }, 400);
  };

  const apply = (nextState) => {
    const base = history.slice(0, pointer + 1);
    const updated = [...base, nextState];
    const trimmed = updated.length > HISTORY_MAX ? updated.slice(updated.length - HISTORY_MAX) : updated;
    setHistory(trimmed);
    setPointer(trimmed.length - 1);
  };

  const ensureUnarchiveOnWork = async () => {
    if (!isArchivedStory) return;
    setIsArchivedStory(false);
    try {
      await sendStoryUpdate({ archive: false, reevalDueAt: null });
    } catch (e) {
      console.warn('[unarchive on work] failed, will reflect locally', e);
    }
    patchStoriesIndex(Number(id), {
      id: Number(id),
      archive: false,
      updatedAt: new Date().toISOString(),
      reevalDueAt: null,
    });
    try {
      const prev = readSnapshot(id) || {};
      writeSnapshot(id, {
        ...prev,
        archive: false,
        reevalDueAt: null,
        rereviewToken: null,
        rereviewStartedRound: null,
      });
      localStorage.setItem(ARCHIVE_KEY(), 'false');
      sessionStorage.setItem(ACTIVE_HIGHLIGHT_KEY(), String(id));
    } catch {}
    openUnarchivedToast();
  };

  const changeField = async (field, value) => {
    if (field === 'title' || field === 'content') userTouchedRef.current = true;

    const next = { ...current, [field]: value };
    apply(next);
    scheduleSave({ [field]: value });

    const nowIso = new Date().toISOString();
    if (field === 'title') {
      scheduleSnapshot({ title: value, content: next.content });
      patchStoriesIndex(Number(id), { title: value, updatedAt: nowIso });
    } else if (field === 'content') {
      scheduleSnapshot({ content: value });
      patchStoriesIndex(Number(id), { updatedAt: nowIso });
    }
  };

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    const newPtr = pointer - 1;
    setPointer(newPtr);
    const s = history[newPtr];
    scheduleSave({ title: s.title, content: s.content });
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const newPtr = pointer + 1;
    setPointer(newPtr);
    const s = history[newPtr];
    scheduleSave({ title: s.title, content: s.content });
  };

  const makeTempId = () => -(Date.now() + Math.floor(Math.random() * 1000));

  const scheduleIdeaUpdate = (iid, payload) => {
    const key = String(iid);
    const prev = ideaPendingRef.current.get(iid) || {};
    ideaPendingRef.current.set(iid, { ...prev, ...payload });

    if (ideaTimersRef.current.has(key)) clearTimeout(ideaTimersRef.current.get(key));
    const t = setTimeout(() => {
      const p = ideaPendingRef.current.get(iid);
      if (p) {
        sendIdeaUpdate(iid, p).catch(console.error);
        ideaPendingRef.current.delete(iid);
      }
      ideaTimersRef.current.delete(key);
    }, IDEA_DEBOUNCE);
    ideaTimersRef.current.set(key, t);
  };

const focusBeliefInput = (bid) => {
  const el = document.getElementById(`belief-input-${bid}`);
  if (!el) return;

  try { el.focus({ preventScroll: true }); } catch { el.focus(); }
  const len = el.value?.length ?? 0;
  try { el.setSelectionRange(len, len); } catch {}

  const container = contentRef.current;
  if (!container) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {} return; }

  const ensureVisible = () => {
    const cRect = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const vvH = window.visualViewport?.height ?? window.innerHeight;
    const bottomLimit = Math.min(cRect.bottom, vvH) - 16;
    const topLimit = cRect.top + 8;
    if (r.top < topLimit) {
      container.scrollBy({ top: r.top - topLimit, behavior: 'smooth' });
    } else if (r.bottom > bottomLimit) {
      container.scrollBy({ top: r.bottom - bottomLimit, behavior: 'smooth' });
    }
  };

  ensureVisible();
  const vv = window.visualViewport;
  if (vv) {
    const onVV = () => { setTimeout(ensureVisible, 25); vv.removeEventListener('resize', onVV); };
    vv.addEventListener('resize', onVV);
  }
  setTimeout(ensureVisible, 120);
};

  const addBelief = async (initialText = '', sourceRange = null) => {
    // 1) если уже есть пустая идея — просто сфокусируем её и выходим
    const currentList = current?.beliefs || [];
    const existingEmpty = currentList.find(b => !((b.text || '').trim()));
    if (existingEmpty) {
      // показываем список, если был скрыт
      setShowBelief(true);
      // дождёмся отрисовки и фокусим
      requestAnimationFrame(() => {
        requestAnimationFrame(() => focusBeliefInput(existingEmpty.id));
      });
      return existingEmpty.id;
    }

    // 2) обычное создание (как было)
    userTouchedRef.current = true;
    markStoryDirty(id);

    const safeText = typeof initialText === 'string' ? initialText : '';
    setShowBelief(true);
    const tempId = makeTempId();

    const beliefObj = {
      id: tempId,
      uiKey: `t-${tempId}`,
      text: safeText,
      score: '',
      introducedRound: reevalRound,
      ...(sourceRange &&
        Number.isInteger(sourceRange.start) &&
        Number.isInteger(sourceRange.end) &&
        sourceRange.end > sourceRange.start
          ? { srcStart: sourceRange.start, srcEnd: sourceRange.end }
          : {}),
    };

    latestIdeaTextRef.current.set(tempId, safeText);
    apply({ ...current, beliefs: [beliefObj, ...currentList] });

    // мягкий фокус + прокрутка в зону видимости
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        focusBeliefInput(tempId);
        setTimeout(() => focusBeliefInput(tempId), 50);
      });
    });

    patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });

    if (safeText && safeText.trim()) {
      try {
        await ensureIdeaCreated(tempId, {
          text: safeText.trim().slice(0, IDEA_CHAR_LIMIT),
          score: null,
          introducedRound: reevalRound,
        });
        await ensureUnarchiveOnWork();
      } catch (e) {
        console.warn('[create idea immediately] failed', e);
      }
    }

    return tempId;
  };

  const ensureIdeaCreated = async (tempId, initial) => {
    if (tempId > 0) return tempId;

    const existing = creatingIdeaRef.current.get(tempId);
    if (existing) return existing;

    const job = (async () => {
      const created = await sendCreateIdea(id, {
        text: initial.text ?? '',
        score: initial.score ?? null,
        sortOrder: Date.now(),
        introducedRound: (initial?.introducedRound ?? reevalRound),
      });

      setHistory(prevHist => {
        const last = prevHist[prevHist.length - 1] || { title: '', content: '', beliefs: [] };
        const list = last.beliefs || [];

        const nextBeliefs = list.map(b => {
          if (b.id !== tempId) return b;

          const localLatest = latestIdeaTextRef.current.get(tempId);
          const localFromState = b.text ?? '';
          const preferredLocal = (typeof localLatest === 'string' ? localLatest : localFromState) ?? '';
          const hasUsefulLocal = preferredLocal && preferredLocal !== '\u200B' && preferredLocal.trim().length > 0;

          return {
            ...b,
            id: created.id,
            text: hasUsefulLocal ? preferredLocal : (created.text || ''),
            introducedRound: b.introducedRound ?? (created.introducedRound ?? reevalRound),
            uiKey: b.uiKey,
          };
        });

        const clone = prevHist.slice();
        clone[clone.length - 1] = { ...last, beliefs: nextBeliefs };
        return clone;
      });

      const latest = String((latestIdeaTextRef.current.get(tempId) ?? created.text ?? '')).slice(0, IDEA_CHAR_LIMIT);
      if (latest !== (created.text || '')) {
        try { await sendIdeaUpdate(created.id, { text: latest }); } catch {}
      }

      if (deleteAfterCreateRef.current.has(tempId)) {
        try { await deleteStoryIdea(created.id); } catch {}
        deleteAfterCreateRef.current.delete(tempId);
      }

      creatingIdeaRef.current.delete(tempId);
      latestIdeaTextRef.current.delete(tempId);
      return created.id;
    })();

    creatingIdeaRef.current.set(tempId, job);
    return job;
  };

  const updateBeliefText = async (bid, value) => {
    userTouchedRef.current = true;
    markStoryDirty(id);

    const bEntry = (current.beliefs || []).find(b => b.id === bid);
    if (!bEntry) return;

    const beforeLen = (bEntry.text || '').length;
    const raw = value ?? '';
    const rawLen = raw.length;

    const crossedLimitNow = rawLen > IDEA_CHAR_LIMIT && beforeLen <= IDEA_CHAR_LIMIT;
    const limited = rawLen > IDEA_CHAR_LIMIT ? raw.slice(0, IDEA_CHAR_LIMIT) : raw;

    if (crossedLimitNow) {
      showError(`Достигнут лимит ${IDEA_CHAR_LIMIT} символов`);
    }

    const nextBeliefs = (current.beliefs || []).map(b =>
      b.id === bid ? { ...b, text: limited } : b
    );
    apply({ ...current, beliefs: nextBeliefs });

    latestIdeaTextRef.current.set(bid, limited);

    let serverId = bid;
    if (bid < 0 && limited.trim() !== '') {
      const createdId = await ensureIdeaCreated(bid, { text: limited });
      serverId = createdId;
      if (createdId > 0) {
        await ensureUnarchiveOnWork();
      }
    }

    if (serverId > 0) {
      scheduleIdeaUpdate(serverId, { text: limited });
    }

    patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
  };

  const scheduleMoveToGroupTop = (targetId, toArchive) => {
    const key = String(targetId);
    const prevT = moveTimersRef.current.get(key);
    if (prevT) clearTimeout(prevT);

    const t = setTimeout(() => {
      setHistory(prevHist => {
        const last = prevHist[prevHist.length - 1] || { title: '', content: '', beliefs: [] };
        const list = last.beliefs || [];
        const idx = list.findIndex(b => b.id === targetId);
        if (idx === -1) return prevHist;

        const b = list[idx];
        const actuallyArchived = b.score !== '' && b.score != null && Number(b.score) === 0;
        if (actuallyArchived !== toArchive) return prevHist;

        const rest = list.filter(x => x.id !== targetId);
        const isArchivedFn = (x) => x.score !== '' && x.score != null && Number(x.score) === 0;
        const active   = rest.filter(x => !isArchivedFn(x));
        const archived = rest.filter(isArchivedFn);

        const moved = b;
        const nextBeliefs = toArchive
          ? [...active, moved, ...archived]
          : [moved, ...active, ...archived];

        const clone = prevHist.slice();
        clone[clone.length - 1] = { ...last, beliefs: nextBeliefs };
        return clone;
      });

      moveTimersRef.current.delete(key);
    }, MOVE_AFTER_MS);

    moveTimersRef.current.set(key, t);
  };

  const reorderImmediately = (list, targetId, toArchive) => {
    const idx = (list || []).findIndex(b => b.id === targetId);
    if (idx === -1) return list;
    const moved = list[idx];
    const rest  = list.filter((_, i) => i !== idx);
    const isArch = (x) => x.score !== '' && x.score != null && Number(x.score) === 0;
    const active   = rest.filter(x => !isArch(x));
    const archived = rest.filter(isArch);
    return toArchive
      ? [...active, moved, ...archived]
      : [moved, ...active, ...archived];
  };

  const updateBeliefScore = async (bid, raw) => {
    userTouchedRef.current = true;
    markStoryDirty(id);

    const bEntry = current.beliefs.find(b => b.id === bid);
    if (!bEntry) return;

    const hasText = !!(bEntry.text && bEntry.text.trim().length);
    if (!hasText) {
      if (raw !== '' && raw != null) {
        const nb = current.beliefs.map(b => b.id === bid ? { ...b, score: '' } : b);
        apply({ ...current, beliefs: nb });
        showError('Сначала введите текст идеи');
      }
      return;
    }

    const wasArchived =
      bEntry.score !== '' && bEntry.score != null && Number(bEntry.score) === 0;

    if (raw === '') {
      const nb = current.beliefs.map(b => b.id === bid ? { ...b, score: '' } : b);

      if (wasArchived) {
        if (bid > 0) scheduleIdeaUpdate(bid, { score: null });
        const reordered = reorderImmediately(nb, bid, false);
        apply({ ...current, beliefs: reordered });
      } else {
        apply({ ...current, beliefs: nb });
      }

      patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
      return;
    }

    const n = Math.max(0, Math.min(10, Number(raw)));
    if (Number.isNaN(n)) return;

    await ensureUnarchiveOnWork();

    const nowArchived = n === 0;

    const nextBeliefs = current.beliefs.map(b =>
      b.id === bid ? { ...b, score: String(n) } : b
    );

    let serverId = bid;
    if (serverId < 0) {
      try {
        serverId = await ensureIdeaCreated(serverId, {
          text: (bEntry.text || '').slice(0, IDEA_CHAR_LIMIT),
          score: null,
          introducedRound: bEntry.introducedRound ?? reevalRound,
        });
      } catch (e) {
        console.warn('[ensure create before score] failed', e);
      }
    }
    if (serverId > 0) {
      scheduleIdeaUpdate(serverId, { score: n });
    }

    if (wasArchived !== nowArchived) {
      const reordered = reorderImmediately(nextBeliefs, bid, nowArchived);
      apply({ ...current, beliefs: reordered });
    } else {
      apply({ ...current, beliefs: nextBeliefs });
    }

    editingFromArchiveRef.current.delete(bid);
    patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
  };

  const handleBeliefBlur = async (bid) => {
    userTouchedRef.current = true;

    const b = current.beliefs.find(x => x.id === bid);
    if (!b) return;

    const textEmpty = !b.text?.trim();
    if (!textEmpty) return;

    markStoryDirty(id);

    if (bid > 0) {
      try { await deleteStoryIdea(bid); } catch {}
    } else {
      if (creatingIdeaRef.current.has(bid)) {
        deleteAfterCreateRef.current.add(bid);
      }
    }

    const remaining = (current.beliefs || []).filter(x => x.id !== bid);
    apply({ ...current, beliefs: remaining });

    if (remaining.length === 0) setShowBelief(false);

    latestIdeaTextRef.current.delete(bid);
    creatingIdeaRef.current.delete(bid);
    deleteAfterCreateRef.current.delete(bid);

    patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
  };

  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  const handleArchiveRequest = () => {
    const list = current.beliefs || [];
    if (list.length === 0) { showError('Список идей пуст'); setMenuOpen(false); return; }
    const allZero = list.every(b => b.score !== '' && b.score != null && Number(b.score) === 0);
    if (!allZero) { showError('Все идеи должны иметь 0 психоэмоциональный заряд'); setMenuOpen(false); return; }
    setMenuOpen(false);
    setConfirmArchiveOpen(true);
  };

  const handleCompleteArchive = async () => {
    setConfirmArchiveOpen(false);

    const now = new Date();
    const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const dueISO = due.toISOString();

    try {
      await sendStoryUpdate({ archive: true, reevalDueAt: dueISO });
      setIsArchivedStory(true);
    } catch (e) {
      console.warn('[archive story] failed', e);
    }

    try {
      patchStoriesIndex(Number(id), {
        id: Number(id),
        archive: true,
        updatedAt: now.toISOString(),
        reevalDueAt: dueISO,
      });
      const prev = readSnapshot(id) || {};
      writeSnapshot(id, { ...prev, archive: true, reevalDueAt: dueISO });
      localStorage.setItem(ARCHIVE_KEY(), 'true');
    } catch {}

    navigate('/stories', {
      replace: true,
      state: {
        toast: { type: 'success', text: 'История архивирована' },
        archivedId: Number(id),
        archivedTitle: (current?.title || '').trim(),
      },
    });
  };

  const openMenu = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.right + 20 + window.scrollX;
    const y = rect.top - 5 + window.scrollY;
    setMenuPos({ x: `${x}px`, y: `${y}px` });
    setMenuOpen(true);
  };

  const handleToggleArchive = async (checked) => {
    const prev = archiveOn;
    setArchiveOn(checked);
    try {
      await sendStoryUpdate({ showArchiveSection: !!checked });
    } catch {
      setArchiveOn(prev);
      showError('Не удалось сохранить «Архив идей».');
    }
  };

  const handleSortToggle = async () => {
    const full = current.beliefs || [];
    if (full.length === 0) { showError('Список идей пуст'); return; }
    if (!areAllActiveScored(full)) { showError('Оцените весь список идей'); return; }

    const isArchivedFlag = (b) => b?.score !== '' && b?.score != null && Number(b?.score) === 0;
    const active = full.filter(b => !isArchivedFlag(b));
    const archived = full.filter(isArchivedFlag);

    if (!sortedView) {
      setUnsortedOrder(full.map(b => b.id));
      try { localStorage.setItem(SORT_BASE_KEY(id), JSON.stringify(full.map(b => b.id))); } catch {}
      const activeSorted = active
        .map((b, idx) => ({ ...b, _idx: idx }))
        .sort((a, b) => Number(b.score) - Number(a.score) || a._idx - b._idx)
        .map(({ _idx, ...b }) => b);
      const nextBeliefs = [...activeSorted, ...archived];
      apply({ ...current, beliefs: nextBeliefs });
      setSortedView(true);
      localStorage.setItem(SORT_KEY(id), '1');
      setMenuOpen(false);

      try {
        const order = nextBeliefs.map(b => b.id);
        await sendReorderIdeas(id, order);
      } catch {}
    } else {
      let order = unsortedOrder || [];
      if (!order?.length) {
        try {
          const raw = localStorage.getItem(SORT_BASE_KEY(id));
          const parsed = JSON.parse(raw || '[]');
          if (Array.isArray(parsed) && parsed.length) order = parsed;
        } catch {}
      }

      const indexOf = new Map(order.map((id, i) => [id, i]));
      const restored = full.slice().sort((a, b) =>
        (indexOf.get(a.id) ?? Infinity) - (indexOf.get(b.id) ?? Infinity)
      );
      apply({ ...current, beliefs: restored });
      setSortedView(false);
      localStorage.setItem(SORT_KEY(id), '0');
      setUnsortedOrder(null);
      setMenuOpen(false);

      try {
        await sendReorderIdeas(id, restored.map(b => b.id));
      } catch {}
    }
  };

  const handleStopChange = (contentY) => {
    setStopY(contentY ?? null);

    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }

    try {
      writeSnapshot(id, {
        updatedAt: new Date().toISOString(),
        archive: !!isArchivedStory,
        stopContentY: contentY ?? null,
        baselineContent: baseline ?? '',
        reevalCount: reevalRound ?? 0,
        showArchiveSection: archiveOn ?? true,
        lastViewContentY: null,
        remindersEnabled: remindersOn ?? false,
        remindersFreqSec: reminderFreqSec ?? 30,
        remindersIndex: reminderIdx ?? 0,
        remindersPaused: reminderPaused ?? false,
        title: current.title ?? '',
        content: current.content ?? '',
        ideas: (current.beliefs || []).map(b => ({
          id: b.id,
          text: b.text ?? '',
          score: b.score === '' ? null : Number(b.score),
          introducedRound: b.introducedRound ?? 0,
          sortOrder: Number.isFinite(b.sortOrder) ? b.sortOrder : 0,
          ...(typeof b.srcStart === 'number' && typeof b.srcEnd === 'number'
            ? { srcStart: b.srcStart, srcEnd: b.srcEnd }
            : {}),
        })),
      });
    } catch {}
  };

  const handleReevaluate = async () => {
    const list = current.beliefs || [];
    if (list.length === 0) { showError('Список идей пуст'); return; }
    if (!areAllActiveScored(list)) { showError('Оцените весь список идей'); return; }

    await flushPendingWrites();

    try {
      const { round } = await sendReevaluate(id);
      const nextBeliefs = list.map(b =>
        (b.score !== '' && b.score != null && Number(b.score) === 0) ? b : { ...b, score: '' }
      );
      apply({ ...current, beliefs: nextBeliefs });
      setReevalRound(round || 0);
      setMenuOpen(false);
      patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
      markStoryDirty(id);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Не удалось сохранить переоценку';
      showError(msg);
    }
  };

  const handleToggleReminders = async (checked) => {
    const prev = remindersOn;
    setRemindersOn(checked);
    try {
      await sendStoryUpdate({ remindersEnabled: !!checked });
    } catch {
      setRemindersOn(prev);
      showError('Не удалось сохранить «Напоминания».');
    }
  };

  const handleChangeReminderFreq = async (value) => {
    const prev = reminderFreqSec;
    setReminderFreqSec(value);
    try {
      await sendStoryUpdate({ remindersFreqSec: value });
    } catch {
      setReminderFreqSec(prev);
      showError('Не удалось сохранить частоту напоминаний.');
    }
  };

  const handlePauseChange = async (paused) => {
    const prev = reminderPaused;
    setReminderPaused(paused);
    try {
      await sendStoryUpdate({ remindersPaused: !!paused });
    } catch {
      setReminderPaused(prev);
      showError('Не удалось сохранить паузу напоминаний.');
    }
  };

  const handleReminderIndexChange = (nextIdx) => {
    setReminderIdx(nextIdx);
    scheduleSave({ remindersIndex: nextIdx });
  };

  const handleViewYChange = (contentYTop) => {
    if (contentYTop == null) return;
    scheduleSave({ lastViewContentY: contentYTop });
    try {
      sessionStorage.setItem(VK(id), String(contentYTop));
      localStorage.setItem(VKL(id), String(contentYTop));
    } catch {}
  };

  const net = navigator.connection?.effectiveType || '';
  const isSlow = /(^2g|3g)/i.test(net);

  const showIdeasSpinner = useSmartDelay(ideasLoading, { delayIn: isSlow ? 100 : 200, minVisible: isSlow ? 400 : 300 });
  const showOverlaySmart = useSmartDelay(showOverlay, { delayIn: isSlow ? 200 : 300, minVisible: isSlow ? 600 : 400 });

  const handleAddIdeaFromSelection = (payload) => {
    const t = (typeof payload === 'string' ? payload : payload?.text || '').trim();
    const range = typeof payload === 'object' ? payload?.range : null;
    if (!t) return;
    if (t.length > IDEA_CHAR_LIMIT) {
      showError(`Выделенный текст длиннее ${IDEA_CHAR_LIMIT} символов — идея не добавлена`);
      return;
    }
    addBelief(t, range);
  };

  const setHighlightFromIdea = (bid) => {
    const b = (current.beliefs || []).find(x => x.id === bid);
    if (b && Number.isInteger(b.srcStart) && Number.isInteger(b.srcEnd) && b.srcEnd > b.srcStart) {
      setActiveHighlight({ start: b.srcStart, end: b.srcEnd });
    }
  };
  const handleIdeaFocus = (bid) => { setHighlightFromIdea(bid); };
  const handleIdeaClick = (bid) => { setHighlightFromIdea(bid); };
  const handleIdeaBlur  = () => { setActiveHighlight(null); };

  if (!id) {
    return <FullScreenLoader />;
  }

  return (
    <div key={id || slug} className={s.viewport}>
      {showOverlaySmart && <FullScreenLoader />}

      <BackBtn className={s.hideBackOnMobile} />

      <div className={s.headerSticky} data-lock-scroll="true">
        <StoryHeader
          title={current.title}
          onTitleChange={(v) => changeField('title', v)}
          onTitleBlur={() => scheduleSave({ title: current.title, content: current.content })}
          canUndo={pointer > 0}
          canRedo={pointer < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onAddBelief={(mode) => {
            if (mode === 'pointer') {
              try { vkRef.current?.focus({ preventScroll: true }); } catch {}
            }
            addBelief();
          }}
          onOpenMenu={(e) => openMenu(e)}
          menuOpen={menuOpen}
          reevalRound={reevalRound}
          onBack={() => navigate('/stories')}
        />
      </div>

      <div className={s.scrollArea} ref={contentRef} role="region" aria-label="История">
        <StoryText
          value={current.content}
          onChange={(v) => changeField('content', v)}
          storyId={id}
          initialStopContentY={stopY}
          initialViewContentY={initialViewY}
          onViewYChange={handleViewYChange}
          onReady={() => {}}
          onStopChange={handleStopChange}
          baseline={baseline}
          reevalRound={reevalRound}
          vhRatio={0.50}
          onAddIdeaFromSelection={handleAddIdeaFromSelection}
          activeHighlight={activeHighlight}
        />

        {remindersOn !== null && (
          <Tips
            visible={!!remindersOn}
            index={reminderIdx}
            onIndexChange={handleReminderIndexChange}
            freqSec={reminderFreqSec ?? null}
            pausedExternal={reminderPaused}
            onPauseChange={handlePauseChange}
          />
        )}

        {!canTrustCache && showIdeasSpinner ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <Spinner size={24} />
          </div>
        ) : (
          <IdeaList
            visible={showBelief || (current.beliefs?.length > 0)}
            beliefs={current.beliefs || []}
            showArchive={archiveOn}
            reevalRound={reevalRound}
            onTextChange={updateBeliefText}
            onScoreChange={updateBeliefScore}
            onBlurEmpty={handleBeliefBlur}
            practicesById={{ __default: PRACTICES.map(p => ({ id: p.slug, slug: p.slug, title: p.title, description: p.description })) }}
            onIdeaClick={handleIdeaClick}
            onIdeaFocus={handleIdeaFocus}
            onIdeaBlur={handleIdeaBlur}
            initialHydrate={canTrustCache}
            freezeAnimKey={freezeAnimKey}
          />
        )}

        <StoryMenu
          open={menuOpen}
          position={menuPos}
          onClose={() => setMenuOpen(false)}
          onSort={handleSortToggle}
          sorted={sortedView}
          onReevaluate={handleReevaluate}
          remindersEnabled={!!remindersOn}
          onToggleReminders={handleToggleReminders}
          reminderFreqSec={reminderFreqSec}
          onChangeReminderFreq={handleChangeReminderFreq}
          archiveEnabled={archiveOn}
          onToggleArchive={handleToggleArchive}
          onArchiveStory={handleArchiveRequest}
        />

        <CompleteModal
          open={confirmArchiveOpen}
          onCancel={() => setConfirmArchiveOpen(false)}
          onConfirm={handleCompleteArchive}
        />

        <input
          ref={vkRef}
          className={s.vkCatcher}
          type="text"
          inputMode="text"
          autoComplete="off"
          aria-hidden="true"
          tabIndex={-1}
        />

        <Toast message={toastMsg} type={toastType || 'success'} duration={5000} version={toastKey} />
      </div>
    </div>
  );
}
