import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './Ideas.module.css';
import BackBtn from '../../components/BackBtn/BackBtn';

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

const CHAR_LIMIT = 80;

export default function Ideas() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [stories, setStories] = useState({ active: [], archive: [] });
  const [loading, setLoading] = useState(true);

  const [menuFor, setMenuFor] = useState(null);        // id идеи или 'bulk'
  const [searchStory, setSearchStory] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const inputRefs = useRef(new Map());

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
    const uiKey = `t${Date.now()}`;
    const sortOrder = Date.now();
    setItems(prev => [{ id: -sortOrder, uiKey, text: '', sortOrder }, ...prev]);
    focusByUiKey(uiKey);
  };

  const handleChange = async (id, uiKey, text) => {
    const limited = String(text || '').slice(0, CHAR_LIMIT);

    setItems(prev => prev.map(i => i.uiKey === uiKey ? { ...i, text: limited } : i));

    if (id < 0) {
      const created = await createInboxIdea({ text: limited });
      setItems(prev =>
        prev.map(i => i.uiKey === uiKey ? { ...created, text: limited, uiKey } : i)
      );
      focusByUiKey(uiKey);
    } else {
      await updateInboxIdea(id, { text: limited });
    }
  };

  const handleBlurEmpty = async (id, uiKey) => {
    const it = items.find(x => x.uiKey === uiKey);
    if (!it) return;
    if ((it.text || '').trim()) return;

    if (id > 0) {
      try { await deleteInboxIdea(id); } catch {}
    }
    setItems(prev => prev.filter(i => i.uiKey !== uiKey));
  };

  const openMenu = (id) => setMenuFor(id);
  const closeMenu = () => setMenuFor(null);

  const moveTo = async (storyId) => {
    const id = menuFor;
    if (!id || id === 'bulk') return;
    closeMenu();
    await moveInboxIdea(id, storyId);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const createStory = async () => {
    const id = menuFor;
    if (!id || id === 'bulk') return;
    closeMenu();
    const { storyId } = await createStoryFromInboxIdea(id);
    navigate(`${STORY_ROUTE}/${storyId}`);
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
    await Promise.all(ids.map(id => moveInboxIdea(id, storyId)));
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const createStoryFromSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setMenuFor(null);

    const { storyId } = await createStoryFromInboxIdea(ids[0]);
    if (ids.length > 1) {
      await Promise.all(ids.slice(1).map(id => moveInboxIdea(id, storyId)));
    }
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    navigate(`${STORY_ROUTE}/${storyId}`);
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
      <BackBtn />
      <div className={classes.container}>
        <IdeasHeader
          title="Идеи на обработку"
          selectMode={selectMode}
          selectedCount={selectedIds.size}
          onToggleSelectMode={toggleSelectMode}
          onPrimaryClick={selectMode ? openBulkMenu : addQuick}
        />

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

              <button className={classes.cancelBtn} onClick={closeMenu}>Отмена</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
