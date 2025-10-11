import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './Ideas.module.css';
import BackBtn from '../../components/BackBtn/BackBtn';
import { subscribe, getActorChannel, startRealtime } from '../../utils/realtime';
import Toast from '../../components/Toast/Toast';

import {
  listInboxIdeas,
  createInboxIdea,
  updateInboxIdea,
  deleteInboxIdea,
  moveInboxIdea,
  createStoryFromInboxIdea,
} from '../../http/inboxIdeaApi';

import { fetchStories } from '../../http/storyApi';
import { STORY_ROUTE } from '../../utils/consts';

import EmptyIdeasState from '../../components/Ideas/EmptyIdeasState/EmptyIdeasState';
import IdeasHeader from '../../components/Ideas/IdeasHeader/IdeasHeader';
import IdeaList from '../../components/Ideas/IdeaList/IdeaList';
import { flushSync } from 'react-dom';

// 👇 добавлено для opId-схемы
import { genOpId, markSentOp, isOwnOp } from '../../utils/opId';

const CHAR_LIMIT = 80;

export default function Ideas() {
  const [toast, setToast] = useState({ msg: '', ver: 0 });
  const navigate = useNavigate();
const showToast = (msg) => setToast(({ ver }) => ({ msg, ver: ver + 1 }));
  const [items, setItems] = useState([]);
  const [stories, setStories] = useState({ active: [], archive: [] });
  const [loading, setLoading] = useState(true);

  const [menuFor, setMenuFor] = useState(null);
  const [searchStory, setSearchStory] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const inputRefs = useRef(new Map());

  const creatingRef = useRef(new Map());
  const seqRef = useRef(0);

  // helper для прокидывания opId
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
          listInboxIdeas(),
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
        try {
          el.focus();
          const len = el.value?.length ?? 0;
          el.setSelectionRange?.(len, len);
        } catch {}
      } else if (left > 0) {
        setTimeout(() => tryFocus(left - 1), 30);
      }
    };
    tryFocus(tries);
  };

  const addQuick = () => {
   const uiKey = `t${Date.now()}_${seqRef.current++}`;
   const sortOrder = Date.now();
   // Синхронно вставляем элемент, чтобы ref уже существовал в том же жесте
   flushSync(() => {
     setItems(prev => [{ id: -sortOrder, uiKey, text: '', sortOrder }, ...prev]);
   });
   // Немедленный фокус — открывает клавиатуру на iOS
   focusByUiKey(uiKey, 1);
   // fail-safe на случай медленного layout
   setTimeout(() => focusByUiKey(uiKey), 0);
 };

  const handleChange = async (id, uiKey, text) => {
    const limited = String(text || '').slice(0, CHAR_LIMIT);
    setItems(prev => prev.map(i => i.uiKey === uiKey ? { ...i, text: limited } : i));

    if (id < 0) {
      if (creatingRef.current.get(uiKey)) return;
      creatingRef.current.set(uiKey, true);
      try {
        // создаём с opId
        const created = await withOp(createInboxIdea, { text: limited });
        setItems(prev =>
          prev.map(i => i.uiKey === uiKey ? { ...created, uiKey, text: i.text } : i)
        );
        // сразу синхронизируем последнее значение
        const latest = (() => {
          const it = inputRefs.current.get(uiKey);
          return (it?.value ?? limited).slice(0, CHAR_LIMIT);
        })();
        await withOp(updateInboxIdea, created.id, { text: latest });
        focusByUiKey(uiKey);
      } finally {
        creatingRef.current.delete(uiKey);
      }
    } else {
      await withOp(updateInboxIdea, id, { text: limited });
    }
  };

  const handleBlurEmpty = async (id, uiKey) => {
    const it = items.find(x => x.uiKey === uiKey);
    if (!it) return;
    if ((it.text || '').trim()) return;

    if (id > 0) {
      try { await withOp(deleteInboxIdea, id); } catch {}
    }
    creatingRef.current.delete(uiKey);
    // Локально удаляем сразу — UI отзывчивый. Сокет-сообщение с нашим opId мы игнорируем.
    setItems(prev => prev.filter(i => i.uiKey !== uiKey));
  };

  const openMenu = (id) => setMenuFor(id);
  const closeMenu = () => setMenuFor(null);

  const moveTo = async (storyId) => {
  const id = menuFor;
  if (!id || id === 'bulk') return;
  closeMenu();
  await withOp(moveInboxIdea, id, storyId);
  setItems(prev => prev.filter(i => i.id !== id));
  showToast('Идея перемещена');
};

const createStory = async () => {
  const id = menuFor;
  if (!id || id === 'bulk') return;
  closeMenu();
  const { storyId, slug } = await withOp(createStoryFromInboxIdea, id);
  // удалим из списка локально, если ещё есть
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

  // Идём СНИЗУ ВВЕРХ, чтобы верхние получили больший sortOrder и оказались сверху
  for (const id of ids.slice().reverse()) {
    await withOp(moveInboxIdea, id, storyId);
  }

  setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
  setSelectedIds(new Set());
  setSelectMode(false);
  showToast(ids.length === 1 ? 'Идея перемещена' : `Перемещено идей: ${ids.length}`);
};


const createStoryFromSelected = async () => {
  const ids = [...selectedIds];
  if (ids.length === 0) return;
  setMenuFor(null);

  // один вызов: первая — в URL, остальные — в additionalIds
  const firstId = ids[0];
  const tail = ids.slice(1);

  const { storyId, slug } = await withOp(
    (first, rest, opts) => createStoryFromInboxIdea(first, { additionalIds: rest }, opts),
    firstId,
    tail
  );

  // локально чистим из инбокса
  setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
  setSelectedIds(new Set());
  setSelectMode(false);

  showToast(ids.length === 1
    ? 'Создана новая история с идеей'
    : `Создана история и перемещено идей: ${ids.length}`);

  navigate(`${STORY_ROUTE}/${slug || storyId}`);
};


  const filteredActive = useMemo(() => {
    const q = searchStory.trim().toLowerCase();
    if (!q) return stories.active;
    return stories.active.filter(s => (s.title || '').toLowerCase().includes(q));
  }, [stories.active, searchStory]);

  const filteredArchive = useMemo(() => {
    const q = searchStory.trim().toLowerCase();
    if (!q) return stories.archive;
    return stories.archive.filter(s => (s.title || '').toLowerCase().includes(q));
  }, [stories.archive, searchStory]);

  if (loading) {
    return (
      <div className={classes.center}>
        <div className={classes.spinner} />
      </div>
    );
  }

  return (
    <>
      {/* Десктоп: BackBtn есть; на мобилке спрячем через CSS */}
      <BackBtn className={classes.backDesktop} />
      <Toast message={toast.msg} version={toast.ver} placement="bottom" />

      <div className={classes.viewport}>
        {/* Мобильный фикс-хедер: слева «Выбор», по центру заголовок, справа круглый + */}
        <IdeasHeader
          title="Идеи на обработку"
          selectMode={selectMode}
          selectedCount={selectedIds.size}
          onToggleSelectMode={toggleSelectMode}
          onPrimaryClick={selectMode ? openBulkMenu : addQuick}
        />

        {/* Скроллится только список */}
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

      {menuFor && (
        <div className={classes.menuOverlay} onClick={() => { setMenuFor(null); }}>
          <div className={classes.menu} onClick={(e) => e.stopPropagation()}>
            <div className={classes.menuTitle}>
              {menuFor === 'bulk'
                ? `Переместить выбранные идеи (${selectedIds.size})`
                : 'Переместить в историю'}
            </div>

            <input
              className={classes.search}
              placeholder="Поиск истории"
              value={searchStory}
              onChange={(e) => setSearchStory(e.target.value)}
            />

            <div className={classes.section}>
              <div className={classes.sectionTitle}>Активные</div>
              <div className={classes.storyList}>
                {filteredActive.map(s => (
                  <button
                    key={s.id}
                    className={classes.storyBtn}
                    onClick={() => (menuFor === 'bulk' ? moveSelectedTo(s.id) : moveTo(s.id))}
                  >
                    {s.title || '(без названия)'}
                  </button>
                ))}
                {filteredActive.length === 0 && <div className={classes.dim}>Не найдено</div>}
              </div>
            </div>

            <div className={classes.section}>
              <div className={classes.sectionTitle}>Архив</div>
              <div className={classes.storyList}>
                {filteredArchive.map(s => (
                  <button
                    key={s.id}
                    className={classes.storyBtn}
                    onClick={() => (menuFor === 'bulk' ? moveSelectedTo(s.id) : moveTo(s.id))}
                  >
                    {s.title || '(без названия)'}
                  </button>
                ))}
                {filteredArchive.length === 0 && <div className={classes.dim}>Не найдено</div>}
              </div>
            </div>

            <div className={classes.hr} />

            {menuFor === 'bulk' ? (
              <button className={classes.createBtn} onClick={createStoryFromSelected}>
                Создать новую историю из выбранных
              </button>
            ) : (
              <button className={classes.createBtn} onClick={createStory}>
                Создать новую историю с этой идеей
              </button>
            )}

            <button className={classes.cancelBtn} onClick={() => setMenuFor(null)}>Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}
