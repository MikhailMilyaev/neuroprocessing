import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from 'react-dom';
import StoryCard from "./StoryCard/StoryCard";
import StoryModal from "./StoryModal/StoryModal";
import Spinner from "../../Spinner/Spinner";
import useDelayedVisible from "../../../hooks/useDelayedVisible";
import EmptyState from "../EmptyState/EmptyState";

import classes from "./StoriesList.module.css";

/* ===== utils ===== */
const getTs = (s) => {
  const v = s?.updatedAt ?? s?.updated_at ?? s?.createdAt ?? s?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a, b) => getTs(b) - getTs(a));

export default function StoriesList({
  searchInput,
  storiesList,
  isLoading,
  onDeleteStory,
  showArchive = false,
  onAddStory,
  onToggleArchive,
  closeKey = 0,
  inlineAddSignal = 0,
  onRenameStory,
  onTempCommit,
  newlyCreatedId = null,         // id свежесозданной карточки (мобильный путь)
  clearNewlyCreated = () => {},  // очистка флага после входа в редакт
}) {
  const navigate = useNavigate();

  /* ===== спиннер ===== */
  const showSpinner = useDelayedVisible(
    isLoading && (storiesList?.length ?? 0) === 0,
    200
  );

  /* ===== поиск ===== */
  const q = (searchInput || "").trim().toLocaleLowerCase("ru-RU");

  const activeStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => !s.archive);
    const filtered = q
      ? base.filter((s) => (s.title ?? "").toLocaleLowerCase("ru-RU").includes(q))
      : base;
    return sortByUpdated(filtered);
  }, [storiesList, q]);

  const archiveStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => s.archive);
    const filtered = q
      ? base.filter((s) => (s.title ?? "").toLocaleLowerCase("ru-RU").includes(q))
      : base;
    return sortByUpdated(filtered);
  }, [storiesList, q]);

  /* ===== инлайн-режимы редактирования ===== */
  const [editingId, setEditingId] = useState(null);
  const [draftId, setDraftId] = useState(null); // старый черновик (если используется)

  // id -> boolean: был ли заголовок в момент входа в редакт
  const hadTitleOnEditRef = useRef(new Map());
  const suppressReopenRef = useRef(false);

  const isMobile = () =>
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  const rememberHadTitle = (id, title) => {
    const had = !!(title && title.trim().length > 0);
    hadTitleOnEditRef.current.set(String(id), had);
  };
  const forgetHadTitle = (id) => {
    hadTitleOnEditRef.current.delete(String(id));
  };

  useEffect(() => {
    const onFocusNew = (e) => {
      const raw = e?.detail;
      if (raw == null) return;
      if (suppressReopenRef.current) return;
      const id = String(raw);
      // На мобилке — сразу включаем режим редактирования СИНХРОННО
      if (window.matchMedia('(max-width:700px)').matches &&
          window.matchMedia('(hover: none)').matches &&
          window.matchMedia('(pointer: coarse)').matches) {
        flushSync(() => {
          setEditingId(id);
          rememberHadTitle(id, '');
        });
        // Моментальный фокус (та же цепочка жеста)
        const row = document.querySelector(`[data-story-id="${id}"]`);
        if (row) {
          try { row.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch {}
        }
        const input = row?.querySelector('input[aria-label="Заголовок истории"]');
        if (input) {
          try { input.focus({ preventScroll: true }); } catch { input.focus(); }
          const len = input.value?.length ?? 0;
          try { input.setSelectionRange(len, len); } catch {}
        }
      }
    };
    document.addEventListener('stories:focus-new', onFocusNew);
    return () => document.removeEventListener('stories:focus-new', onFocusNew);
  }, []);

  // Сигнал «создать черновик» (исторический поток)
  useEffect(() => {
    if (!inlineAddSignal) return;
    const id = `draft-${Date.now()}`;
    setDraftId((prev) => prev ?? id);
    setEditingId((prev) => prev ?? id);
    hadTitleOnEditRef.current.set(String(id), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineAddSignal]);

  // Мобильный путь: пришёл id новой карточки → включаем редакт и фокус на ней
  useEffect(() => {
    if (!newlyCreatedId) return;
    // Мобилка: инлайн-создание уже отработало → НЕ возвращаем в редакт и просто чистим флаг
    const isMob =
      window.matchMedia('(max-width:700px)').matches &&
      window.matchMedia('(hover: none)').matches &&
      window.matchMedia('(pointer: coarse)').matches;
    if (isMob) {
      clearNewlyCreated?.();
      return;
    }
    // Десктоп: обычно роутинг делается в onAddStory, здесь ничего не делаем.
    clearNewlyCreated?.();
  }, [newlyCreatedId, clearNewlyCreated]);

  const finishEditing = (id) => {
    if (editingId === id) setEditingId(null);
    forgetHadTitle(id);
    if (newlyCreatedId && String(newlyCreatedId) === String(id)) {
      clearNewlyCreated?.();
    }
  };

  const beginRename = (id, title) => {
    setEditingId(String(id));
    rememberHadTitle(id, title);
  };

  const submitDraft = async (title) => {
    const t = (title || "").trim();
    if (!t) return;

    try {
      suppressReopenRef.current = true;

      // Только МОБИЛЬНЫЙ путь
      const isMob =
        window.matchMedia('(max-width:700px)').matches &&
        window.matchMedia('(hover: none)').matches &&
        window.matchMedia('(pointer: coarse)').matches;

      if (isMob) {
        // 1) Немедленно выходим из режима редактирования (до await)
        flushSync(() => {
          setEditingId(null);
          setDraftId(null);
        });
        // 2) Снимаем фокус с поля — прячем клавиатуру
        try { document.activeElement?.blur?.(); } catch {}
      }

      // 3) Создаём историю (список потом сам обновится)
      await onAddStory?.(t);

      clearNewlyCreated?.();
    } catch (e) {
      console.error("[create story]", e);
    } finally {
      // Даём списку перерендериться и защищаемся от stories:focus-new
      setTimeout(() => { suppressReopenRef.current = false; }, 120);
    }
  };

  useEffect(() => {
    const onTempResolved = (e) => {
      const { tempId, realId } = e?.detail || {};
      if (!tempId || !realId) return;
      if (suppressReopenRef.current) return;

      // Если редактировали именно temp — переносим режим редактирования на реальный id
      const wasEditing = String(editingId) === String(tempId);
      if (!wasEditing) return;

      flushSync(() => {
        setEditingId(String(realId));
        // перенесём флаг "был ли заголовок" на новый id
        const had = hadTitleOnEditRef.current.get(String(tempId));
        if (had !== undefined) {
          hadTitleOnEditRef.current.delete(String(tempId));
          hadTitleOnEditRef.current.set(String(realId), had);
        }
      });

      // вернуть фокус в инпут новой карточки
      const row = document.querySelector(`[data-story-id="${realId}"]`);
      if (row) {
        try { row.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch {}
      }
      const input = row?.querySelector('input[aria-label="Заголовок истории"]');
      if (input) {
        try { input.focus({ preventScroll: true }); } catch { input.focus(); }
        const len = input.value?.length ?? 0;
        try { input.setSelectionRange(len, len); } catch {}
      }
    };

    document.addEventListener('stories:temp-resolved', onTempResolved);
    return () => document.removeEventListener('stories:temp-resolved', onTempResolved);
  }, [editingId]);

  const submitRename = async (id, value /* currentTitle */) => {
    const trimmed = (value || "").trim();
    const hadTitle = !!hadTitleOnEditRef.current.get(String(id));
    const isTemp = String(id).startsWith("temp-");

    if (isTemp) {
      // temp → коммитим через onTempCommit
      try {
        suppressReopenRef.current = true;

        const isMob =
          window.matchMedia('(max-width:700px)').matches &&
          window.matchMedia('(hover: none)').matches &&
          window.matchMedia('(pointer: coarse)').matches;

        if (isMob) {
          flushSync(() => { setEditingId(null); });
          try { document.activeElement?.blur?.(); } catch {}
        }

        await onTempCommit?.(id, trimmed);

        if (!isMob) finishEditing(id);
      } finally {
        setTimeout(() => { suppressReopenRef.current = false; }, 120);
      }
      return;
    }

    if (!trimmed) {
      if (hadTitle) {
        try {
          suppressReopenRef.current = true;
          await onRenameStory?.(id, "");
          finishEditing(id);
        } finally {
          setTimeout(() => { suppressReopenRef.current = false; }, 0);
        }
      } else {
        try {
          suppressReopenRef.current = true;
          await onDeleteStory?.(id);
          finishEditing(id);
        } finally {
          setTimeout(() => { suppressReopenRef.current = false; }, 0);
        }
      }
      return;
    }

    // обычное переименование
    try {
      suppressReopenRef.current = true;

      const isMob =
        window.matchMedia('(max-width:700px)').matches &&
        window.matchMedia('(hover: none)').matches &&
        window.matchMedia('(pointer: coarse)').matches;

      if (isMob) {
        // Закрываем редакт сразу, до await — карточка моментально кликабельна
        flushSync(() => { setEditingId(null); });
        try { document.activeElement?.blur?.(); } catch {}
      }

      await onRenameStory?.(id, trimmed);

      if (!isMob) finishEditing(id);
    } finally {
      setTimeout(() => { suppressReopenRef.current = false; }, 120);
    }
  };

  /* ===== выбор списка ===== */
  const listToRender = showArchive ? archiveStories : activeStories;
  const isEmpty = listToRender.length === 0;

  // подмешиваем черновик сверху, если он есть
  const baseList = draftId
    ? [{ id: draftId, title: "", updatedAt: new Date().toISOString(), _draft: true }, ...listToRender]
    : listToRender;

  // страховка от дублей id (на всякий)
  const seen = new Set();
  const listWithNoDupes = baseList.filter((s) => {
    const k = String(s.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  /* ===== контекстное меню (десктоп) ===== */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(null);

  const handleContextMenu = (event, id) => {
    if (window.matchMedia("(max-width:700px)").matches) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    setSelectedId(id);
    setIsModalOpen(true);
    setModalPosition({ x: event.clientX, y: event.clientY });
  };

  const handleDeleteClick = async () => {
    if (selectedId == null) return;
    await onDeleteStory?.(selectedId);
    setIsModalOpen(false);
    setSelectedId(null);
  };

  return (
    <>
      {showSpinner ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 70 }}>
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {isEmpty && !draftId ? (
            <EmptyState
              variant={showArchive ? "archive" : "active"}
              title={showArchive ? "В архиве пусто" : "Историй пока нет"}
              subtitle={
                showArchive
                  ? "Архивируйте историю, если все идеи имеют нулевой психоэмоциональный заряд."
                  : archiveStories.length > 0
                  ? "Создайте новую или откройте архив, чтобы вернуть историю."
                  : "Нажмите «Добавить», чтобы создать историю."
              }
              ctaLabel={!showArchive ? "Добавить историю" : undefined}
              onCtaClick={
                !showArchive
                  ? () => {
                      if (editingId) return;
                      const id = `draft-${Date.now()}`;

                      flushSync(() => {
                        setDraftId(id);
                        setEditingId(id);
                        rememberHadTitle(id, "");
                      });

                      const tryFocus = (retries = 6) => {
                        const row = document.querySelector(`[data-story-id="${id}"]`);
                        const input = row?.querySelector('input[aria-label="Заголовок истории"]');
                        if (input) {
                          try { row?.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch {}
                          try { input.focus({ preventScroll: true }); } catch { input.focus(); }
                          const len = input.value?.length ?? 0;
                          try { input.setSelectionRange(len, len); } catch {}
                          return;
                        }
                        if (retries > 0) {
                          requestAnimationFrame(() => tryFocus(retries - 1));
                        }
                      };

                      // первая попытка сразу (тот же жест), затем — ретрай через rAF
                      tryFocus();
                    }
                  : undefined
              }
              secondaryCtaLabel={
                showArchive ? "К историям" : archiveStories.length > 0 ? "Открыть архив" : undefined
              }
              onSecondaryClick={() => onToggleArchive?.(!showArchive)}
            />
          ) : (
            <div className={classes.listWrap}>
              {listWithNoDupes.map((s) => {
                const idStr = String(s.id);
                const isEditingThis = String(editingId) === idStr;

                return (
                  <StoryCard
                    key={s.id}
                    {...s}
                    isHighlighted={isModalOpen && selectedId === s.id}
                    onContextMenu={(e) => handleContextMenu(e, s.id)}
                    onDelete={onDeleteStory}
                    closeKey={closeKey}
                    /* инлайн-режимы */
                    isDraft={!!s._draft}
                    isEditing={isEditingThis}
                    onBeginRename={() => beginRename(s.id, s.title)}
                    onSubmitTitle={(value) => (s._draft ? submitDraft(value) : submitRename(s.id, value, s.title))}
                    onCancelEdit={() => {
                      if (s._draft) {
                        setEditingId(null);
                        setDraftId(null);
                        forgetHadTitle(s.id);
                      } else {
                        finishEditing(s.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {isModalOpen && (
            <StoryModal
              open={isModalOpen}
              position={modalPosition}
              onDelete={handleDeleteClick}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}
