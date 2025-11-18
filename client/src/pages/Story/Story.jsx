import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStoryBySlug, fetchStory, updateStory, reevaluateStory, beginRereview } from '../../http/storyApi';
import { listStoryIdeas, createStoryIdea, updateStoryIdea, deleteStoryIdea, reorderStoryIdeas } from '../../http/storyIdeasApi';
import { ns } from '../../utils/ns';
import { subscribe, getActorChannel, startRealtime } from '../../utils/realtime';
import { genOpId, markSentOp, isOwnOp } from '../../utils/opId';
import StoryHeader from '../../components/Story/StoryHeader/StoryHeader';
import StoryMenu from '../../components/Story/StoryHeader/StoryMenu/StoryMenu';
import StoryText from '../../components/Story/StoryText/StoryText';
import IdeaList from '../../components/Story/StoryIdeas/IdeaList/IdeaList';
import Spinner from '../../components/Spinner/Spinner';
import FullScreenLoader from '../../components/FullScreenLoader/FullScreenLoader';
import CompleteModal from '../../components/Story/CompleteModal/CompleteModal';
import ReevaluateModal from '../../components/Story/ReevaluateModal/ReevaluateModal';
import Toast from '../../components/Toast/Toast';
import {
  readSnapshot,
  writeSnapshot,
  isSeenThisSession,
  markSeenThisSession,
  markStoryDirty,
  clearStoryDirty,
} from '../../utils/cache/storySnapshot';
import { patchStoriesIndex, removeFromStoriesIndex, readStoriesIndex } from '../../utils/cache/storiesCache';
import { useSmartDelay } from '../../hooks/useSmartDelay';
import { listPractices } from '../../http/practiceApi';
import s from './Story.module.css';

const HK = (id) => ns(`story_history_${id}`);
const PK = (id) => ns(`story_pointer_${id}`);

const VK = (id) => ns(`story_viewY_${id}`);
const VKL = (id) => ns(`story_viewY_local_${id}`);

const ARCHIVE_KEY = () => ns('showArchive');
const ACTIVE_HIGHLIGHT_KEY = () => ns('stories_active_highlight');
const SAVE_DEBOUNCE = 600;
const IDEA_DEBOUNCE = 600;
const HISTORY_MAX = 200;
const IDEA_CHAR_LIMIT = 80;

const SORT_KEY = (id) => ns(`story_sorted_${id}`);
const SORT_BASE_KEY = (id) => ns(`story_sorted_base_${id}`);

const parseFinite = (v) => {
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
  ideas.map((i) => ({
    id: i.id,
    uiKey: `i-${i.id}`,
    text: i.text || '',
    score: i.score == null ? '' : String(i.score),
    introducedRound: i.introducedRound ?? 0,
    sortOrder: Number.isFinite(i?.sortOrder) ? i.sortOrder : 0,
  }));

export default function Story() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const idFromIndex = useMemo(() => {
    const idx = readStoriesIndex();
    const item = (idx || []).find((s) => s.slug === slug);
    return item?.id ?? null;
  }, [slug]);

  const [id, setId] = useState(idFromIndex);
  const initialSnap = id ? readSnapshot(id) : null;
  if (id && initialSnap && (initialSnap.reevalCount ?? 0) > 0) {
    const hasZeroes = Array.isArray(initialSnap.ideas) && initialSnap.ideas.some((i) => i?.score === 0);
    if (hasZeroes) {
      writeSnapshot(id, {
        ...initialSnap,
        ideas: (initialSnap.ideas || []).map((i) => ({ ...i, score: null })),
      });
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

  const userTouchedRef = useRef(false);

  const saveTimerRef = useRef(null);
  const lastStoryPayloadRef = useRef(null);

  const ideaTimersRef = useRef(new Map());
  const ideaPendingRef = useRef(new Map());

  const snapTimerRef = useRef(null);

  const creatingIdeaRef = useRef(new Map());
  const latestIdeaTextRef = useRef(new Map());
  const deleteAfterCreateRef = useRef(new Set());

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: '0px', y: '0px' });

  const [archiveOn, setArchiveOn] = useState(true);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastKey, setToastKey] = useState(0);
  const showError = (msg) => {
    setToastMsg(msg);
    setToastType('error');
    setToastKey((k) => k + 1);
  };

  const [sortedView, setSortedView] = useState(false);
  const contentRef = useRef(null);

  const [allPractices, setAllPractices] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ps = await listPractices();
        if (!cancelled) setAllPractices(Array.isArray(ps) ? ps : []);
      } catch {
        if (!cancelled) setAllPractices([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const practicesById = useMemo(() => ({ __default: allPractices }), [allPractices]);

  useEffect(() => {
    if (!id) return;
    try {
      const v = localStorage.getItem(SORT_KEY(id));
      if (v === '1') setSortedView(true);
      if (v === '0') setSortedView(false);
    } catch {}
  }, [id]);

  const [unsortedOrder, setUnsortedOrder] = useState(null);

  const [reevalRound, setReevalRound] = useState(canTrustCache ? initialSnap.reevalCount ?? 0 : 0);
  const [ideasLoading, setIdeasLoading] = useState(!canTrustCache);
  const [showOverlay, setShowOverlay] = useState(false);

  const current = useMemo(
    () => history[pointer] ?? { title: '', content: '', beliefs: [] },
    [history, pointer]
  );

  const [isArchivedStory, setIsArchivedStory] = useState(canTrustCache ? !!initialSnap.archive : false);

  const isArchived = (b) => b?.score !== '' && b?.score != null && Number(b.score) === 0;

  const areAllActiveScored = (list) => {
    const active = (list || []).filter((b) => !isArchived(b));
    if (active.length === 0) return true;
    return active.every((b) => {
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
    setToastKey((k) => k + 1);
  };

  const hydratedFromCacheRef = useRef(canTrustCache);
  const [freezeAnimKey, setFreezeAnimKey] = useState(0);

  const [initialViewY, setInitialViewY] = useState(() =>
    canTrustCache ? pickInitialViewYFromStorages(id, initialSnap) : null
  );

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
          setReevalRound(snap.reevalCount ?? 0);
          setIdeasLoading(false);
        }

        if (!snap && !isSeenThisSession(story.id)) setShowOverlay(true);
      } catch {
        navigate('/stories', { replace: true });
      } finally {
        if (!cancelled) {}
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  useEffect(() => {
    if (!id) return;

    const onStorage = (e) => {
      if (e.key !== SORT_KEY(id)) return;

      const wantSorted = e.newValue === '1';
      setSortedView(wantSorted);

      const full = history[pointer]?.beliefs || [];
      if (!full.length) return;

      const isArchivedFlag = (b) => b?.score !== '' && b?.score != null && Number(b?.score) === 0;

      if (wantSorted) {
        const active = full.filter((b) => !isArchivedFlag(b));
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
            localStorage.setItem(SORT_BASE_KEY(id), JSON.stringify(full.map((b) => b.id)));
          }
        } catch {}
      } else {
        let base = [];
        try {
          base = JSON.parse(localStorage.getItem(SORT_BASE_KEY(id)) || '[]');
        } catch {}
        if (!Array.isArray(base) || base.length === 0) return;

        const pos = new Map(base.map((bid, i) => [bid, i]));
        const restored = full.slice().sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity));
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
          !!story?.archive &&
          ((dueToken && snapToken !== dueToken) || (!dueToken && snapStartedRound !== roundToUse));

        if (shouldStartRereview) {
          startedFromArchive = true;
          try {
            const { round } = await beginRereview(id);
            roundToUse = round || roundToUse + 1;
          } catch {
            roundToUse = roundToUse + 1;
          }
        }

        const ideasRaw = await listStoryIdeas(id).catch(() => []);
        if (cancelled) return;

        let beliefs = mapIdeasToBeliefs(ideasRaw);

        try {
          const wantSorted = localStorage.getItem(SORT_KEY(id)) === '1';
          if (wantSorted) {
            const isArchivedFlag = (b) => b?.score !== '' && b?.score != null && Number(b?.score) === 0;
            const active = beliefs.filter((b) => !isArchivedFlag(b));
            const archived = beliefs.filter(isArchivedFlag);
            const activeSorted = active
              .map((b, idx) => ({ ...b, _idx: idx }))
              .sort((a, b) => Number(b.score) - Number(a.score) || a._idx - b._idx)
              .map(({ _idx, ...b }) => b);
            beliefs = [...activeSorted, ...archived];
            setSortedView(true);
          }
        } catch {}

        const prevOrder = (initialSnapLocal?.ideas || []).map((i) => i.id);
        const serverOrder = ideasRaw.map((i) => i.id);
        const sameOrder =
          prevOrder.length === serverOrder.length && prevOrder.every((v, i) => v === serverOrder[i]);

        setHistory([{ title: story?.title || '', content: story?.content || '', beliefs }]);
        setPointer(0);
        setIsArchivedStory(!!story?.archive);
        setReevalRound(roundToUse);

        setArchiveOn(story?.showArchiveSection ?? true);
        setInitialViewY((v) => {
          if (v != null) return v;
          const fromStorages = pickInitialViewYFromStorages(id, initialSnapLocal);
          const fromDb = parseFinite(story?.lastViewContentY);
          return fromStorages ?? fromDb ?? null;
        });

        const nextRereviewToken = shouldStartRereview
          ? dueToken || `round:${roundToUse}`
          : snapToken ?? dueToken ?? null;

        writeSnapshot(id, {
          updatedAt: story?.updatedAt || new Date().toISOString(),
          archive: !!story?.archive,
          reevalDueAt: story?.reevalDueAt ?? null,
          rereviewToken: nextRereviewToken,
          rereviewStartedRound: shouldStartRereview
            ? roundToUse
            : Number.isFinite(snapStartedRound)
            ? snapStartedRound
            : null,
          reevalCount: roundToUse,
          showArchiveSection: story?.showArchiveSection ?? true,
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
          setFreezeAnimKey((k) => k + 1);
        }
        hydratedFromCacheRef.current = false;
      } catch {
        setShowOverlay(false);
        setIdeasLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isIOSStandalone = useMemo(() => {
    const ua = navigator.userAgent || '';
    const isiOS =
      /iP(hone|ad|od)/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    return isiOS && standalone;
  }, []);

  const isEmptyStory = (current.beliefs?.length ?? 0) === 0;

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
        setToastKey((k) => k + 1);
        navigate('/stories', { replace: true });
        return;
      }

      if (msg?.type !== 'story.updated') return;

      const p = msg.patch || {};

      setHistory((prev) => {
        const last = prev[prev.length - 1] || { title: '', content: '', beliefs: [] };
        const next = {
          ...last,
          ...(p.title !== undefined ? { title: p.title } : {}),
          ...(p.content !== undefined ? { content: p.content } : {}),
        };
        const base = prev.slice(0, prev.length - 1);
        return [...base, next];
      });

      if (p.archive !== undefined) setIsArchivedStory(!!p.archive);

      try {
        const prevSnap = readSnapshot(id) || {};
        writeSnapshot(id, {
          ...prevSnap,
          updatedAt: p.updatedAt || new Date().toISOString(),
          ...(p.title !== undefined ? { title: p.title } : {}),
          ...(p.content !== undefined ? { content: p.content } : {}),
          ...(p.archive !== undefined ? { archive: !!p.archive } : {}),
          ...(p.reevalDueAt !== undefined ? { reevalDueAt: p.reevalDueAt ?? null } : {}),
        });
      } catch {}

      try {
        patchStoriesIndex(Number(id), {
          id: Number(id),
          ...(p.title !== undefined ? { title: p.title } : {}),
          ...(p.archive !== undefined ? { archive: !!p.archive } : {}),
          ...(p.slug !== undefined ? { slug: p.slug } : {}),
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
              setToastKey((k) => k + 1);
              navigate('/stories', { replace: true });
              return;
            }
            patchStoriesIndex(Number(id), {
              id: Number(id),
              ...(p.title !== undefined ? { title: p.title } : {}),
              ...(p.archive !== undefined ? { archive: !!p.archive } : {}),
              ...(p.slug !== undefined ? { slug: p.slug } : {}),
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
            if (list.some((b) => b.id === i.id)) return list;

            const norm = (t) => (t || '').trim();
            const serverText = norm(i.text);

            const hasTempSame = list.some((b) => b.id < 0 && norm(b.text) === serverText);
            if (hasTempSame) return list;

            const b = mapIdeasToBeliefs([i])[0];
            const isArchived = (v) => v.score !== '' && v.score != null && Number(v.score) === 0;
            const active = list.filter((x) => !isArchived(x));
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
            const idx = list.findIndex((b) => b.id === iid);
            if (idx === -1) {
              return list.map((b) => {
                if (b.id !== iid) return b;
                return {
                  ...b,
                  ...(p.text !== undefined ? { text: p.text } : {}),
                  ...(p.score !== undefined
                    ? { score: p.score == null ? '' : String(p.score) }
                    : {}),
                  ...(p.sortOrder !== undefined ? { sortOrder: p.sortOrder } : {}),
                };
              });
            }

            const prevItem = list[idx];
            const wasArchived =
              prevItem.score !== '' && prevItem.score != null && Number(prevItem.score) === 0;

            const nextItem = {
              ...prevItem,
              ...(p.text !== undefined ? { text: p.text } : {}),
              ...(p.score !== undefined
                ? { score: p.score == null ? '' : String(p.score) }
                : {}),
              ...(p.sortOrder !== undefined ? { sortOrder: p.sortOrder } : {}),
            };

            const nowArchived =
              nextItem.score !== '' && nextItem.score != null && Number(nextItem.score) === 0;

            let next = list.slice();
            next[idx] = nextItem;

            if (wasArchived !== nowArchived) {
              const rest = next.filter((b) => b.id !== iid);
              const isArch = (x) => x.score !== '' && x.score != null && Number(x.score) === 0;
              const active = rest.filter((x) => !isArch(x));
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
          patchBeliefs((list) => list.filter((b) => b.id !== iid));
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
          setReevalRound(msg.round || 0);
          setHistory((prev) => {
            const last = prev[prev.length - 1] || { title: '', content: '', beliefs: [] };
            const nextBeliefs = (last.beliefs || []).map((b) => {
              const isArchFlag =
                b.score !== '' && b.score != null && Number(b.score) === 0;
              return isArchFlag ? b : { ...b, score: '' };
            });
            const base = prev.slice(0, prev.length - 1);
            return [...base, { ...last, beliefs: nextBeliefs }];
          });

          try {
            const prevSnap = readSnapshot(id) || {};
            writeSnapshot(id, {
              ...prevSnap,
              reevalCount: msg.round || prevSnap.reevalCount || 0,
              updatedAt: new Date().toISOString(),
            });
          } catch {}
          break;
        }

        case 'rereview.started': {
          setReevalRound(msg.round || 0);
          setIsArchivedStory(false);
          setArchiveOn(true);

          try {
            const prevSnap = readSnapshot(id) || {};
            writeSnapshot(id, {
              ...prevSnap,
              archive: false,
              reevalDueAt: null,
              reevalCount: msg.round || prevSnap.reevalCount || 0,
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
    } catch {}
    try {
      sessionStorage.setItem(PK(id), String(pointer));
    } catch {}
  }, [history, pointer, id]);

  useEffect(() => {
    const timersMap = ideaTimersRef.current;
    const pendingMap = ideaPendingRef.current;

    return () => {
      (async () => {
        const saveTimer = saveTimerRef.current;
        const lastPayload = lastStoryPayloadRef.current;

        if (lastPayload) {
          try {
            await sendStoryUpdate(lastPayload);
          } catch {}
        }
        if (saveTimer) clearTimeout(saveTimer);
        lastStoryPayloadRef.current = null;

        if (snapTimerRef.current) clearTimeout(snapTimerRef.current);

        for (const [, t] of timersMap.entries()) clearTimeout(t);
        for (const [iid, payload] of pendingMap.entries()) {
          try {
            await sendIdeaUpdate(iid, payload);
          } catch {}
        }
        timersMap.clear();
        pendingMap.clear();
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
      try {
        await sendStoryUpdate(lastPayload);
      } catch {}
      lastStoryPayloadRef.current = null;
    }
    for (const t of ideaTimersRef.current.values()) clearTimeout(t);
    ideaTimersRef.current.clear();

    const pending = ideaPendingRef.current;
    if (pending.size) {
      const jobs = [];
      for (const [iid, payload] of pending.entries()) {
        jobs.push(sendIdeaUpdate(iid, payload));
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

        reevalCount: reevalRound ?? 0,
        showArchiveSection: archiveOn ?? true,

        title: (partial?.title ?? current.title) ?? '',
        content: (partial?.content ?? current.content) ?? '',
        ideas: (current.beliefs || []).map((b) => ({
          id: b.id,
          text: b.text ?? '',
          score: b.score === '' ? null : Number(b.score),
          introducedRound: b.introducedRound ?? 0,
          sortOrder: Number.isFinite(b.sortOrder) ? b.sortOrder : 0,
        })),
      });
    }, 400);
  };

  const apply = (nextState) => {
    const base = history.slice(0, pointer + 1);
    const updated = [...base, nextState];
    const trimmed =
      updated.length > HISTORY_MAX ? updated.slice(updated.length - HISTORY_MAX) : updated;
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

  const addBelief = async (initialText = '') => {
    const currentList = current?.beliefs || [];
    const existingEmpty = currentList.find((b) => !(b.text || '').trim());
    if (existingEmpty) {
      setShowBelief(true);
      return existingEmpty.id;
    }

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
    };

    latestIdeaTextRef.current.set(tempId, safeText);
    apply({ ...current, beliefs: [beliefObj, ...currentList] });

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
        introducedRound: initial?.introducedRound ?? reevalRound,
      });

      setHistory((prevHist) => {
        const last = prevHist[prevHist.length - 1] || { title: '', content: '', beliefs: [] };
        const list = last.beliefs || [];

        const nextBeliefs = list.map((b) => {
          if (b.id !== tempId) return b;

          const localLatest = latestIdeaTextRef.current.get(tempId);
          const localFromState = b.text ?? '';
          const preferredLocal =
            (typeof localLatest === 'string' ? localLatest : localFromState) ?? '';
          const hasUsefulLocal =
            preferredLocal &&
            preferredLocal !== '\u200B' &&
            preferredLocal.trim().length > 0;

          return {
            ...b,
            id: created.id,
            text: hasUsefulLocal ? preferredLocal : created.text || '',
            introducedRound:
              b.introducedRound ?? created.introducedRound ?? reevalRound,
            uiKey: b.uiKey,
          };
        });

        const clone = prevHist.slice();
        clone[clone.length - 1] = { ...last, beliefs: nextBeliefs };
        return clone;
      });

      const latest = String(
        (latestIdeaTextRef.current.get(tempId) ?? created.text ?? '')
      ).slice(0, IDEA_CHAR_LIMIT);
      if (latest !== (created.text || '')) {
        try {
          await sendIdeaUpdate(created.id, { text: latest });
        } catch {}
      }

      if (deleteAfterCreateRef.current.has(tempId)) {
        try {
          await deleteStoryIdea(created.id);
        } catch {}
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

    const bEntry = (current.beliefs || []).find((b) => b.id === bid);
    if (!bEntry) return;

    const beforeLen = (bEntry.text || '').length;
    const raw = value ?? '';
    const rawLen = raw.length;

    const crossedLimitNow = rawLen > IDEA_CHAR_LIMIT && beforeLen <= IDEA_CHAR_LIMIT;
    const limited = rawLen > IDEA_CHAR_LIMIT ? raw.slice(0, IDEA_CHAR_LIMIT) : raw;

    if (crossedLimitNow) {
      showError(`Достигнут лимит ${IDEA_CHAR_LIMIT} символов`);
    }

    const nextBeliefs = (current.beliefs || []).map((b) =>
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

  const reorderImmediately = (list, targetId, toArchive) => {
    const idx = (list || []).findIndex((b) => b.id === targetId);
    if (idx === -1) return list;
    const moved = list[idx];
    const rest = list.filter((_, i) => i !== idx);
    const isArch = (x) => x.score !== '' && x.score != null && Number(x.score) === 0;
    const active = rest.filter((x) => !isArch(x));
    const archived = rest.filter(isArch);
    return toArchive ? [...active, moved, ...archived] : [moved, ...active, ...archived];
  };

  const updateBeliefScore = async (bid, raw) => {
    userTouchedRef.current = true;
    markStoryDirty(id);

    const bEntry = current.beliefs.find((b) => b.id === bid);
    if (!bEntry) return;

    const hasText = !!(bEntry.text && bEntry.text.trim().length);
    if (!hasText) {
      if (raw !== '' && raw != null) {
        const nb = current.beliefs.map((b) =>
          b.id === bid ? { ...b, score: '' } : b
        );
        apply({ ...current, beliefs: nb });
        showError('Сначала введите текст идеи');
      }
      return;
    }

    const wasArchived =
      bEntry.score !== '' && bEntry.score != null && Number(bEntry.score) === 0;

    if (raw === '') {
      const nb = current.beliefs.map((b) =>
        b.id === bid ? { ...b, score: '' } : b
      );

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

    const nextBeliefs = current.beliefs.map((b) =>
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

    patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
  };

  const handleBeliefBlur = async (bid) => {
    userTouchedRef.current = true;

    const b = current.beliefs.find((x) => x.id === bid);
    if (!b) return;

    const textEmpty = !b.text?.trim();
    if (!textEmpty) return;

    markStoryDirty(id);

    if (bid > 0) {
      try {
        await deleteStoryIdea(bid);
      } catch {}
    } else {
      if (creatingIdeaRef.current.has(bid)) {
        deleteAfterCreateRef.current.add(bid);
      }
    }

    const remaining = (current.beliefs || []).filter((x) => x.id !== bid);
    apply({ ...current, beliefs: remaining });

    if (remaining.length === 0) setShowBelief(false);

    latestIdeaTextRef.current.delete(bid);
    creatingIdeaRef.current.delete(bid);
    deleteAfterCreateRef.current.delete(bid);

    patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
  };

  const [confirmReevalOpen, setConfirmReevalOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  const handleArchiveRequest = () => {
    const list = current.beliefs || [];
    if (list.length === 0) {
      showError('Список идей пуст');
      setMenuOpen(false);
      return;
    }
    const allZero = list.every(
      (b) => b.score !== '' && b.score != null && Number(b.score) === 0
    );
    if (!allZero) {
      showError('Все идеи должны иметь 0 психоэмоциональный заряд');
      setMenuOpen(false);
      return;
    }
    setMenuOpen(false);
    setConfirmArchiveOpen(true);
  };

  // запрос на переоценку — только валидация + открытие модалки
  const handleReevaluateRequest = () => {
    const list = current.beliefs || [];
    if (list.length === 0) {
      showError('Список идей пуст');
      return;
    }
    if (!areAllActiveScored(list)) {
      showError('Оцените весь список идей');
      return;
    }
    setConfirmReevalOpen(true);
  };

  // подтверждение переоценки — тут уже реальные запросы
  const handleConfirmReevaluate = async () => {
    const list = current.beliefs || [];
    setConfirmReevalOpen(false);

    await flushPendingWrites();

    try {
      const { round } = await sendReevaluate(id);
      const nextBeliefs = list.map((b) =>
        b.score !== '' && b.score != null && Number(b.score) === 0
          ? b
          : { ...b, score: '' }
      );
      apply({ ...current, beliefs: nextBeliefs });
      setReevalRound(round || 0);
      patchStoriesIndex(Number(id), { updatedAt: new Date().toISOString() });
      markStoryDirty(id);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Не удалось сохранить переоценку';
      showError(msg);
    }
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
    if (full.length === 0) {
      showError('Список идей пуст');
      return;
    }
    if (!areAllActiveScored(full)) {
      showError('Оцените весь список идей');
      return;
    }

    const isArchivedFlag = (b) => b?.score !== '' && b?.score != null && Number(b?.score) === 0;
    const active = full.filter((b) => !isArchivedFlag(b));
    const archived = full.filter(isArchivedFlag);

    if (!sortedView) {
      setUnsortedOrder(full.map((b) => b.id));
      try {
        localStorage.setItem(
          SORT_BASE_KEY(id),
          JSON.stringify(full.map((b) => b.id))
        );
      } catch {}
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
        const order = nextBeliefs.map((b) => b.id);
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
      const restored = full.slice().sort(
        (a, b) => (indexOf.get(a.id) ?? Infinity) - (indexOf.get(b.id) ?? Infinity)
      );
      apply({ ...current, beliefs: restored });
      setSortedView(false);
      localStorage.setItem(SORT_KEY(id), '0');
      setUnsortedOrder(null);
      setMenuOpen(false);

      try {
        await sendReorderIdeas(id, restored.map((b) => b.id));
      } catch {}
    }
  };

  const handleViewYChange = (contentYTop) => {
    if (contentYTop == null) return;
    scheduleSave({ lastViewContentY: contentYTop });
    try {
      sessionStorage.setItem(VK(id), String(contentYTop));
      localStorage.setItem(VKL(id), String(contentYTop));
    } catch {}
  };

  const showIdeasSpinner = useSmartDelay(ideasLoading, {
    delayIn: 200,
    minVisible: 300,
  });
  const showOverlaySmart = useSmartDelay(showOverlay, {
    delayIn: 300,
    minVisible: 400,
  });

  if (!id) {
    return <FullScreenLoader />;
  }

  return (
    <div key={id || slug} className={s.viewport}>
      {showOverlaySmart && <FullScreenLoader />}

      <div className={s.headerSticky} data-lock-scroll="true">
        <StoryHeader
          title={current.title}
          onTitleChange={(v) => changeField('title', v)}
          onTitleBlur={() =>
            scheduleSave({ title: current.title, content: current.content })
          }
          onAddBelief={() => addBelief()}
          onOpenMenu={(e) => openMenu(e)}
          menuOpen={menuOpen}
          reevalRound={reevalRound}
          onBack={() => navigate('/stories')}
        />
      </div>

      <div
        className={s.scrollArea}
        ref={contentRef}
        role="region"
        aria-label="История"
      >
        <StoryText
          value={current.content}
          onChange={(v) => changeField('content', v)}
          storyId={id}
          onReady={() => {}}
          initialViewContentY={initialViewY}
          onViewYChange={handleViewYChange}
        />

        {!canTrustCache && showIdeasSpinner ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 16,
            }}
          >
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
            initialHydrate={canTrustCache}
            freezeAnimKey={freezeAnimKey}
            practicesById={practicesById}
          />
        )}

        <StoryMenu
          open={menuOpen}
          position={menuPos}
          onClose={() => setMenuOpen(false)}
          onSort={handleSortToggle}
          sorted={sortedView}
          onReevaluate={handleReevaluateRequest}
          archiveEnabled={archiveOn}
          onToggleArchive={handleToggleArchive}
          onArchiveStory={handleArchiveRequest}
        />

        <ReevaluateModal
          open={confirmReevalOpen}
          onCancel={() => setConfirmReevalOpen(false)}
          onConfirm={handleConfirmReevaluate}
        />

        <CompleteModal
          open={confirmArchiveOpen}
          onCancel={() => setConfirmArchiveOpen(false)}
          onConfirm={handleCompleteArchive}
        />

        <Toast
          message={toastMsg}
          type={toastType || 'success'}
          duration={5000}
          version={toastKey}
        />
      </div>
    </div>
  );
}
