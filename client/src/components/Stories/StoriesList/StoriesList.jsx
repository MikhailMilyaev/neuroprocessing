import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";

import StoryCard from "./StoryCard/StoryCard";
import StoryModal from "./StoryModal/StoryModal";
import Spinner from "../../Spinner/Spinner";
import useDelayedVisible from "../../../hooks/useDelayedVisible";
import EmptyState from "../EmptyState/EmptyState";

import { writeStoriesIndex as replaceStoriesIndex } from "../../../utils/cache/storiesCache";

import classes from "./StoriesList.module.css";

/* ===================== utils ===================== */
const getTs = (s) => {
  const v = s?.updatedAt ?? s?.updated_at ?? s?.createdAt ?? s?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a, b) => getTs(b) - getTs(a));

const toDate = (v) => (v ? new Date(v) : null);
const formatEditedAt = (raw) => {
  const d = toDate(raw);
  if (!d) return "";
  const n = new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const y = new Date(t);
  y.setDate(t.getDate() - 1);
  if (d >= t) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (d >= y && d < t) return "Вчера";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

const isMobileDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width:700px)").matches &&
  window.matchMedia("(hover: none)").matches &&
  window.matchMedia("(pointer: coarse)").matches;

/* ================================================= */

export default function StoriesList({
  searchInput,
  storiesList,
  isLoading,
  onDeleteStory,
  showArchive = false,
  onAddStory,
  onToggleArchive,
  closeKey = 0,
  onRenameStory,
  onTempCommit,
  newlyCreatedId = null,
  clearNewlyCreated = () => {},
}) {
  const navigate = useNavigate();

  const showSpinner = useDelayedVisible(
    isLoading && (storiesList?.length ?? 0) === 0,
    200
  );

  useEffect(() => {
    replaceStoriesIndex(Array.isArray(storiesList) ? storiesList : []);
  }, [storiesList]);

  const q = (searchInput || "").trim().toLocaleLowerCase("ru-RU");

  const activeStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => !s.archive);
    const filtered = q ? base.filter((s) => (s.title ?? "").toLocaleLowerCase("ru-RU").includes(q)) : base;
    return sortByUpdated(filtered);
  }, [storiesList, q]);

  const archiveStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => s.archive);
    const filtered = q ? base.filter((s) => (s.title ?? "").toLocaleLowerCase("ru-RU").includes(q)) : base;
    return sortByUpdated(filtered);
  }, [storiesList, q]);

  /* ================== inline rename/create ================== */
  const [editingId, setEditingId] = useState(null);
  const [draftId, setDraftId] = useState(null);

  const hadTitleOnEditRef = useRef(new Map());
  const suppressReopenRef = useRef(false);

  const rememberHadTitle = (id, title) => {
    const had = !!(title && title.trim().length > 0);
    hadTitleOnEditRef.current.set(String(id), had);
  };
  const forgetHadTitle = (id) => hadTitleOnEditRef.current.delete(String(id));

  useEffect(() => { /* closeKey был для свайпов — сейчас no-op */ }, [closeKey]);

  useEffect(() => {
    if (!newlyCreatedId) return;
    clearNewlyCreated?.();
  }, [newlyCreatedId, clearNewlyCreated]);

  const finishEditing = (id) => {
    if (editingId === id) setEditingId(null);
    forgetHadTitle(id);
    if (newlyCreatedId && String(newlyCreatedId) === String(id)) {
      clearNewlyCreated?.();
    }
  };

  const beginRename = useCallback((id, title) => {
    setEditingId(String(id));
    rememberHadTitle(id, title);
  }, []);

  const submitDraft = async (title) => {
    const t = (title || "").trim();
    if (!t) { setEditingId(null); return; }
    try {
      suppressReopenRef.current = true;
      if (isMobileDevice()) {
        flushSync(() => { setEditingId(null); setDraftId(null); });
        try { document.activeElement?.blur?.(); } catch {}
      }
      const created = await onAddStory?.(t);
      if (!isMobileDevice() && created) {
        const idOrSlug = created.slug || created.id;
        if (idOrSlug != null) navigate(`/story/${idOrSlug}`);
      }
      clearNewlyCreated?.();
    } catch (e) {
      console.error("[create story]", e);
    } finally {
      setTimeout(() => { suppressReopenRef.current = false; }, 120);
    }
  };

  useEffect(() => {
    const onTempResolved = (e) => {
      const { tempId, realId } = e?.detail || {};
      if (!tempId || !realId) return;
      if (suppressReopenRef.current) return;

      const wasEditing = String(editingId) === String(tempId);
      if (!wasEditing) return;

      flushSync(() => {
        setEditingId(String(realId));
        const had = hadTitleOnEditRef.current.get(String(tempId));
        if (had !== undefined) {
          hadTitleOnEditRef.current.delete(String(tempId));
          hadTitleOnEditRef.current.set(String(realId), had);
        }
      });

      const row = document.querySelector(`[data-story-id="${realId}"]`);
      row?.scrollIntoView?.({ behavior: "auto", block: "center" });
      const input = row?.querySelector('input[aria-label="Заголовок истории"]');
      input?.focus?.({ preventScroll: true });
      const len = input?.value?.length ?? 0;
      try { input?.setSelectionRange?.(len, len); } catch {}
    };

    document.addEventListener("stories:temp-resolved", onTempResolved);
    return () => document.removeEventListener("stories:temp-resolved", onTempResolved);
  }, [editingId]);

  const submitRename = async (id, value) => {
    const trimmed = (value || "").trim();
    const isTemp = String(id).startsWith("temp-");

    if (isTemp) {
      try {
        suppressReopenRef.current = true;
        if (isMobileDevice()) {
          flushSync(() => { setEditingId(null); });
          try { document.activeElement?.blur?.(); } catch {}
        }
        await onTempCommit?.(id, trimmed);
        if (!isMobileDevice()) finishEditing(id);
      } finally {
        setTimeout(() => { suppressReopenRef.current = false; }, 120);
      }
      return;
    }

    try {
      suppressReopenRef.current = true;
      if (isMobileDevice()) {
        flushSync(() => { setEditingId(null); });
        try { document.activeElement?.blur?.(); } catch {}
      }
      await onRenameStory?.(id, trimmed);
      if (!isMobileDevice()) finishEditing(id);
    } finally {
      setTimeout(() => { suppressReopenRef.current = false; }, 120);
    }
  };

  /* ================== iOS keyboard keeper ================== */
  const keeperRef = useRef(null);
  const armKeyboardKeeper = useCallback(() => {
    if (!isMobileDevice()) return;
    if (document.getElementById("stories-keyboard-keeper")) return;
    try {
      const el = document.createElement("input");
      el.type = "text";
      el.id = "stories-keyboard-keeper";
      el.setAttribute("aria-hidden", "true");
      el.style.position = "fixed";
      el.style.top = "calc(env(safe-area-inset-top, 0px) + 6px)";
      el.style.left = "6px";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.opacity = "0.01";
      el.style.background = "transparent";
      el.style.border = "none";
      el.style.padding = "0";
      el.style.margin = "0";
      el.style.zIndex = "2147483647";
      el.style.webkitUserSelect = "text";

      document.body.appendChild(el);
      el.focus();
      try { el.setSelectionRange(1, 1); } catch {}
      try { el.click(); } catch {}

      keeperRef.current = el;
    } catch {}
  }, []);

  const removeKeeperSoon = useCallback((ms = 1200) => {
    const el = keeperRef.current;
    keeperRef.current = null;
    if (!el) return;
    setTimeout(() => { try { el.remove(); } catch {} }, ms);
  }, []);

  useEffect(() => {
    const onFocused = () => removeKeeperSoon(10);
    document.addEventListener("stories:mobile-input-focused", onFocused);
    return () => document.removeEventListener("stories:mobile-input-focused", onFocused);
  }, [removeKeeperSoon]);

  /* ================== context/menus & overlay ================== */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(null);

  const [isMobileMode, setIsMobileMode] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const [overlayMeta, setOverlayMeta] = useState(null); // {title,time,isPlaceholder}

  const [createOverlayOpen, setCreateOverlayOpen] = useState(false);

  // слушатель «создать в оверлее» — вызывается ТОЛЬКО по клику (не touchstart)
  useEffect(() => {
    const onOpenCreate = () => {
      if (!isMobileDevice()) return;
      armKeyboardKeeper();
      setCreateOverlayOpen(true);
      // переведём фокус в реальный input StoryModal после маунта
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try { document.dispatchEvent(new Event("stories:force-focus-create")); } catch {}
        });
      });
      removeKeeperSoon(2000);
    };
    document.addEventListener("stories:open-create-overlay", onOpenCreate);
    return () => document.removeEventListener("stories:open-create-overlay", onOpenCreate);
  }, [armKeyboardKeeper, removeKeeperSoon]);

  // helper для моб. редактирования (скролл к карточке и фокус)
  const focusForEditMobile = useCallback((id) => {
    if (!isMobileDevice()) return;
    const scroller = document.querySelector('div[role="region"][aria-label="Список историй"]');
    const row = document.querySelector(`[data-story-id="${id}"]`);
    if (!scroller || !row) return;
    const adjust = () => {
      const sRect = scroller.getBoundingClientRect();
      const rRect = row.getBoundingClientRect();
      const vv = window.visualViewport;
      const viewportH = vv ? vv.height : window.innerHeight;
      const kbApprox = Math.max(0, window.innerHeight - viewportH) || 280;
      const usableH = Math.max(200, scroller.clientHeight - kbApprox);
      const targetOffsetFromTop = Math.round(usableH * 0.25);
      const currentTopInScroller = rRect.top - sRect.top + scroller.scrollTop;
      const desiredScrollTop = Math.max(0, currentTopInScroller - targetOffsetFromTop);
      scroller.scrollTo({ top: desiredScrollTop, behavior: "smooth" });
      setTimeout(() => {
        const input = row.querySelector('input[aria-label="Заголовок истории"]');
        if (input) {
          try { input.focus({ preventScroll: true }); } catch { input.focus(); }
          const len = input.value?.length ?? 0;
          try { input.setSelectionRange(len, len); } catch {}
        }
      }, 80);
    };
    adjust();
    if ("visualViewport" in window && window.visualViewport) {
      const once = () => { setTimeout(adjust, 60); window.visualViewport.removeEventListener("resize", once); };
      window.visualViewport.addEventListener("resize", once, { once: true });
    } else {
      setTimeout(adjust, 180);
    }
  }, []);

  // ПК: открыть возле ⋮
  const openMenuAt = (event, id) => {
    if (isMobileDevice()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.right;
    const y = rect.top + rect.height;
    setSelectedId(id);
    setIsModalOpen(true);
    setIsMobileMode(false);
    setAnchorRect(null);
    setModalPosition({ x, y });
    setOverlayMeta(null);
  };

  // Мобила: long-press
  const openMenuMobile = (id, rect) => {
    if (!isMobileDevice()) return;

    const found = (storiesList || []).find((s) => String(s.id) === String(id));
    const rawTs = found?.updatedAt ?? found?.updated_at ?? found?.createdAt ?? found?.created_at;
    const titleRaw = (found?.title ?? "").trim();
    const meta = {
      title: titleRaw || "Сформулируйте проблему",
      time: formatEditedAt(rawTs),
      isPlaceholder: !titleRaw,
    };

    setSelectedId(id);
    setIsMobileMode(true);
    setIsModalOpen(true);
    setAnchorRect(rect || null);
    setOverlayMeta(meta);
  };

  const handleDeleteClick = async () => {
    if (selectedId == null) return;
    await onDeleteStory?.(selectedId);
    setIsModalOpen(false);
    setSelectedId(null);
    setAnchorRect(null);
    setOverlayMeta(null);
  };

  const handleEditClick = () => {
    if (selectedId == null) return;
    const found = (storiesList || []).find((s) => String(s.id) === String(selectedId));
    beginRename(selectedId, found?.title || "");
    setIsModalOpen(false);
    setAnchorRect(null);
    setOverlayMeta(null);
    setTimeout(() => focusForEditMobile(selectedId), 30);
  };

  /* =============== список к отрисовке =============== */
  const listToRender = showArchive ? archiveStories : activeStories;
  const isEmpty = listToRender.length === 0;

  const baseList = draftId
    ? [{ id: draftId, title: "", updatedAt: new Date().toISOString(), _draft: true }, ...listToRender]
    : listToRender;

  const seen = new Set();
  const listWithNoDupes = baseList.filter((s) => {
    const k = String(s.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  /* =============== submit «создать» в оверлее =============== */
  const submitCreateOverlay = async (title) => {
    const t = (title || "").trim();
    if (!t) { setCreateOverlayOpen(false); return; }
    await onAddStory?.(t, { inline: true });
    setCreateOverlayOpen(false);
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
                      if (isMobileDevice()) {
                        armKeyboardKeeper();
                        setCreateOverlayOpen(true);
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            try { document.dispatchEvent(new Event("stories:force-focus-create")); } catch {}
                          });
                        });
                        removeKeeperSoon(2000);
                        return;
                      }
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
                          row?.scrollIntoView?.({ behavior: "auto", block: "center" });
                          try { input.focus({ preventScroll: true }); } catch { input.focus(); }
                          const len = input.value?.length ?? 0;
                          try { input.setSelectionRange(len, len); } catch {}
                          return;
                        }
                        if (retries > 0) requestAnimationFrame(() => tryFocus(retries - 1));
                      };
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
            <div className={classes.listWrap} role="region" aria-label="Список историй">
              {listWithNoDupes.map((s) => {
                const idStr = String(s.id);
                const isEditingThis = String(editingId) === idStr;
                const mobileSelected = isMobileMode && isModalOpen && selectedId === s.id;

                return (
                  <StoryCard
                    key={s.id}
                    {...s}
                    isHighlighted={false}
                    onDelete={onDeleteStory}
                    closeKey={closeKey}
                    /* инлайн-режимы */
                    isDraft={!!s._draft}
                    isEditing={isEditingThis}
                    onBeginRename={() => beginRename(s.id, s.title)}
                    onSubmitTitle={(value) =>
                      s._draft ? submitDraft(value) : submitRename(s.id, value, s.title)
                    }
                    onCancelEdit={() => {
                      if (s._draft) {
                        setEditingId(null);
                        forgetHadTitle(s.id);
                      } else if (isEditingThis) {
                        finishEditing(s.id);
                      }
                    }}
                    /* десктоп: клик по ⋮ */
                    onOpenMenu={(ev) => openMenuAt(ev, s.id)}
                    menuPinned={isModalOpen && selectedId === s.id && !isMobileMode}
                    /* мобила: long-press */
                    onLongPressMobile={(id, rect) => openMenuMobile(id, rect)}
                    mobileContextActive={mobileSelected}
                  />
                );
              })}
            </div>
          )}

          {/* поповер существующих карточек */}
          {isModalOpen && (
            <StoryModal
              open={isModalOpen}
              position={modalPosition}
              onDelete={handleDeleteClick}
              onEdit={handleEditClick}
              onClose={() => {
                setIsModalOpen(false);
                setAnchorRect(null);
                setOverlayMeta(null);
              }}
              mobile={isMobileMode}
              anchorRect={anchorRect}
              overlayMeta={overlayMeta}
              selectedId={selectedId}
              onMobileEditSubmit={(nextTitle) => submitRename(selectedId, nextTitle)}
            />
          )}

          {/* оверлей создания — сразу режим редактирования */}
          {createOverlayOpen && (
            <StoryModal
              open={createOverlayOpen}
              position={{ x: 0, y: 0 }}
              onDelete={null}
              onEdit={null}
              onClose={() => setCreateOverlayOpen(false)}
              mobile={true}
              anchorRect={null}
              overlayMeta={{ title: "", time: "", isPlaceholder: true }}
              selectedId={null}
              forceMobileEdit={true}
              onMobileEditSubmit={submitCreateOverlay}
            />
          )}
        </>
      )}
    </>
  );
}