import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import classes from './IdeaDrafts.module.css';
import { subscribe, getActorChannel, startRealtime } from '../../utils/realtime';
import Toast from '../../components/Toast/Toast';

import {
  listIdeaDrafts,
  createIdeaDraft,
  updateIdeaDraft,
  deleteIdeaDraft,
  moveIdeaDraft,
  createStoryFromIdeaDraft,
} from '../../http/ideaDraftsApi';

import { fetchStories } from '../../http/storyApi';
import { STORY_ROUTE, STORIES_ROUTE } from '../../utils/consts';

import EmptyIdeasState from '../../components/IdeaDrafts/EmptyIdeasState/EmptyIdeasState';
import IdeaList from '../../components/IdeaDrafts/IdeaList/IdeaList';
import { flushSync } from 'react-dom';

import { genOpId, markSentOp, isOwnOp } from '../../utils/opId';
import IdeasHeader from '../../components/IdeaDrafts/IdeasHeader/IdeasHeader';
import IdeaMoveModal from '../../components/IdeaDrafts/IdeaMoveModal/IdeaMoveModal';

const CHAR_LIMIT = 80;

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

function useHeaderHeightVar(headerRef, varName = '--ideas-header-h') {
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty(varName, `${h}px`);
    };
    setH();
    const ro = ('ResizeObserver' in window) ? new ResizeObserver(setH) : null;
    ro?.observe(el);
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', setH);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', setH);
      window.removeEventListener('orientationchange', setH);
    };
  }, [headerRef, varName]);
}

export default function Ideas() {
  const [toast, setToast] = useState({ msg: '', ver: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const { onOpenSidebar, isSidebarOpen } = useOutletContext?.() || { onOpenSidebar: () => {}, isSidebarOpen: false };

  const backTarget = location.state?.from || STORIES_ROUTE;

  const showToast = (msg) => setToast(({ ver }) => ({ msg, ver: ver + 1 }));
  const [items, setItems] = useState([]);
  const [stories, setStories] = useState({ active: [], archive: [] });
  const [loading, setLoading] = useState(true);

  const [menuFor, setMenuFor] = useState(null);
  const [searchStory, setSearchStory] = useState(''); // можно выпилить позже, сейчас не используется в модалке

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const headerRef = useRef(null);
  useBottomNavHeightVar('--bottom-nav-h');
  useHeaderHeightVar(headerRef, '--ideas-header-h');

  const inputRefs = useRef(new Map());
  const creatingRef = useRef(new Map());
  const seqRef = useRef(0);

  const withOp = async (fn, ...args) => {
    const opId = genOpId();
    markSentOp(opId);
    return fn(...args, { opId });
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [inbox, act, arc] = await Promise.all([
          listIdeaDrafts(),
          fetchStories({ archive: false, limit: 200, fields: 'id,title,archive,updatedAt' }),
          fetchStories({ archive: true,  limit: 200, fields: 'id,title,archive,updatedAt' }),
        ]);
        if (cancel) return;
        setItems((inbox || []).map(it => ({ ...it, uiKey: it.id })));
        const mapRows = (r) => (Array.isArray(r) ? r : (r?.rows || []));
        setStories({ active: mapRows(act), archive: mapRows(arc) });
      } catch {
        if (!cancel) {
          setItems([]);
          setStories({ active: [], archive: [] });
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    startRealtime();
    const actorCh = getActorChannel();
    if (!actorCh) return;
    const off = subscribe(actorCh, (msg) => {
      if (!msg?.type) return;
      if (msg?.opId && isOwnOp(msg.opId)) return;

      setItems((prev) => {
        switch (msg.type) {
          case 'inbox.created': {
            const it = msg.payload;
            if (!it?.id) return prev;
            if (prev.some(x => x.id === it.id)) return prev;
            return [{ ...it, uiKey: it.id }, ...prev];
          }
          case 'inbox.updated': {
            const id = msg.id;
            const p  = msg.patch || {};
            return prev.map(x => x.id === id ? { ...x, ...p } : x);
          }
          case 'inbox.deleted': {
            const id = msg.id;
            return prev.filter(x => x.id !== id);
          }
          default:
            return prev;
        }
      });
    });
    return () => off();
  }, []);

  const focusByUiKey = (uiKey, tries = 10) => {
    const tryFocus = (left) => {
      const el = inputRefs.current.get(uiKey);
      if (el) {
        try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch {} }
        const len = el.value?.length ?? 0;
        try { el.setSelectionRange(len, len); } catch {}
      } else if (left > 0) {
        setTimeout(() => tryFocus(left - 1), 30);
      }
    };
    tryFocus(tries);
  };

  const addQuick = () => {
    const uiKey = `t${Date.now()}_${seqRef.current++}`;
    const sortOrder = Date.now();
    const tempId = -Number(`${sortOrder}${seqRef.current}`);
    flushSync(() => {
      setItems(prev => [{ id: tempId, uiKey, text: '', sortOrder }, ...prev]);
    });

    focusByUiKey(uiKey, 1);
    setTimeout(() => focusByUiKey(uiKey), 0);
  };

  const handleChange = async (id, uiKey, text) => {
    const limited = String(text || '').slice(0, CHAR_LIMIT);
    setItems(prev => prev.map(i => i.uiKey === uiKey ? { ...i, text: limited } : i));

    if (id < 0) {
      if (creatingRef.current.get(uiKey)) return;
      creatingRef.current.set(uiKey, true);
      try {
        const created = await withOp(createIdeaDraft, { text: limited });
        setItems(prev =>
          prev.map(i => i.uiKey === uiKey ? { ...created, uiKey, text: i.text } : i)
        );
        const latest = (() => {
          const it = inputRefs.current.get(uiKey);
          return (it?.value ?? limited).slice(0, CHAR_LIMIT);
        })();
        await withOp(updateIdeaDraft, created.id, { text: latest });
        focusByUiKey(uiKey);
      } finally {
        creatingRef.current.delete(uiKey);
      }
    } else {
      await withOp(updateIdeaDraft, id, { text: limited });
    }
  };

  const handleBlurEmpty = async (id, uiKey) => {
    const it = items.find(x => x.uiKey === uiKey);
    if (!it) return;
    if ((it.text || '').trim()) return;

    if (id > 0) {
      try { await withOp(deleteIdeaDraft, id); } catch {}
    }
    creatingRef.current.delete(uiKey);
    setItems(prev => prev.filter(i => i.uiKey !== uiKey));
  };

  const openMenu = (id) => setMenuFor(id);
  const closeMenu = () => setMenuFor(null);

  const moveTo = async (storyId) => {
    const id = menuFor;
    if (!id || id === 'bulk') return;
    closeMenu();
    await withOp(moveIdeaDraft, id, storyId);
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Идея перемещена');
  };

  const createStory = async () => {
    const id = menuFor;
    if (!id || id === 'bulk') return;
    closeMenu();
    const { storyId, slug } = await withOp(createStoryFromIdeaDraft, id);
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Создана новая история с идеей');
    navigate(`${STORY_ROUTE}/${slug || storyId}`);
  };

  const toggleSelectMode = () => {
    setSelectMode(v => !v);
    setSelectedIds(new Set());
  };

  const isSelected = (id) => selectedIds.has(id);
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const openBulkMenu = () => {
    if (selectedIds.size === 0) return;
    setMenuFor('bulk');
  };

  const moveSelectedTo = async (storyId) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setMenuFor(null);

    await Promise.allSettled(ids.map(id => withOp(moveIdeaDraft, id, storyId)));

    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    showToast(ids.length === 1 ? 'Идея перемещена' : `Перемещено идей: ${ids.length}`);
  };

  const createStoryFromSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setMenuFor(null);

    const firstId = ids[0];
    const tail = ids.slice(1);

    const { storyId, slug } = await withOp(
      (first, rest, opts) => createStoryFromIdeaDraft(first, { additionalIds: rest }, opts),
      firstId,
      tail
    );

    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectMode(false);

    showToast(ids.length === 1
      ? 'Создана новая история с идеей'
      : `Создана история и перемещено идей: ${ids.length}`);

    navigate(`${STORY_ROUTE}/${slug || storyId}`);
  };

  const filteredActive = useMemo(() => stories.active, [stories.active]);
  const filteredArchive = useMemo(() => stories.archive, [stories.archive]);

  const handleLamp = useCallback(() => addQuick(), []);

  if (loading) {
    return (
      <div className={classes.center}>
        <div className={classes.spinner} />
      </div>
    );
  }

  return (
    <>
      <Toast message={toast.msg} version={toast.ver} placement="bottom" />

      <div className={classes.viewport}>
        <div ref={headerRef} className={classes.headerSticky} data-lock-scroll="true">
          <IdeasHeader
            selectMode={selectMode}
            selectedCount={selectedIds.size}
            onToggleSelectMode={toggleSelectMode}
            onLampClick={handleLamp}      
            onMoveClick={openBulkMenu}    
            onOpenSidebar={onOpenSidebar}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        <div className={classes.scrollArea} role="region" aria-label="Список идей">
          <div className={classes.container}>
            {items.length === 0 ? (
              <EmptyIdeasState onAdd={addQuick} />
            ) : (
              <IdeaList
                items={items}
                selectMode={selectMode}
                isSelected={isSelected}
                toggleSelect={toggleSelect}
                onChange={handleChange}
                onBlurEmpty={handleBlurEmpty}
                onOpenMenu={openMenu}
                inputRefs={inputRefs}
              />
            )}
          </div>
        </div>
      </div>

      <IdeaMoveModal
        open={!!menuFor}
        onClose={() => setMenuFor(null)}
        onMoveTo={(storyId) => (menuFor === 'bulk' ? moveSelectedTo(storyId) : moveTo(storyId))}
        onCreateStory={menuFor === 'bulk' ? createStoryFromSelected : createStory}
        activeStories={filteredActive}
        archivedStories={filteredArchive}
      />
    </>
  );
}
