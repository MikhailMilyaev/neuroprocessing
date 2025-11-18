import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";

import StoryCard from "./StoryCard/StoryCard";
import StoryModal from "./StoryModal/StoryModal";
import Spinner from "../../Spinner/Spinner";
import useDelayedVisible from "../../../hooks/useDelayedVisible";
import EmptyState from "../EmptyState/EmptyState";

import { writeStoriesIndex as replaceStoriesIndex } from "../../../utils/cache/storiesCache";

import classes from "./StoriesList.module.css";

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

export default function StoriesList({
  storiesList,
  isLoading,
  onDeleteStory,
  showArchive = false,
  onAddStory,
  onToggleArchive,
  onRenameStory,
  onTempCommit,
}) {
  const showSpinner = useDelayedVisible(
    isLoading && (storiesList?.length ?? 0) === 0,
    200
  );

  useEffect(() => {
    replaceStoriesIndex(Array.isArray(storiesList) ? storiesList : []);
  }, [storiesList]);

  const activeStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => !s.archive);
    return sortByUpdated(base);
  }, [storiesList]);

  const archiveStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => s.archive);
    return sortByUpdated(base);
  }, [storiesList]);

  /* ================== inline rename/create ================== */
  const [editingId, setEditingId] = useState(null);
  const [draftId, setDraftId] = useState(null);

  const suppressReopenRef = useRef(false);

  const finishEditing = (id) => {
    if (editingId === id) setEditingId(null);
  };

  const beginRename = useCallback((id) => {
    setEditingId(String(id));
  }, []);

  // десктопный «призрак» по клику “Добавить”
  useEffect(() => {
    const onBeginDraft = () => {
      if (isMobileDevice()) return;
      const id = `draft-${Date.now()}`;
      flushSync(() => {
        setDraftId(id);
        setEditingId(id);
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
    };
    document.addEventListener("stories:begin-create-draft", onBeginDraft);
    return () => document.removeEventListener("stories:begin-create-draft", onBeginDraft);
  }, []);

  const submitDraft = async (title) => {
    const t = (title || "").trim();
    if (!t) {
      flushSync(() => { setEditingId(null); setDraftId(null); });
      try { document.activeElement?.blur?.(); } catch {}
      return;
    }
    try {
      suppressReopenRef.current = true;
      if (isMobileDevice()) {
        flushSync(() => { setEditingId(null); setDraftId(null); });
        try { document.activeElement?.blur?.(); } catch {}
      }
      await onAddStory?.(t, { inline: true });
      flushSync(() => { setDraftId(null); setEditingId(null); });
    } finally {
      setTimeout(() => { suppressReopenRef.current = false; }, 120);
    }
  };

  // ✅ rename: выходим из режима редактирования сразу, до запроса к серверу
  const submitRename = async (id, value) => {
    const trimmed = (value || "").trim();
    const isTemp = String(id).startsWith("temp-");

    if (isTemp) {
      try {
        suppressReopenRef.current = true;
        if (isMobileDevice()) {
          flushSync(() => { setEditingId(null); });
          try { document.activeElement?.blur?.(); } catch {}
        } else {
          flushSync(() => { setEditingId(null); });
        }
        await onTempCommit?.(id, trimmed);
      } finally {
        setTimeout(() => { suppressReopenRef.current = false; }, 120);
      }
      return;
    }

    try {
      suppressReopenRef.current = true;
      flushSync(() => { setEditingId(null); });
      try { document.activeElement?.blur?.(); } catch {}

      await onRenameStory?.(id, trimmed);
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

  useEffect(() => {
    const onOpenCreate = () => {
      if (!isMobileDevice()) return;
      armKeyboardKeeper();
      setCreateOverlayOpen(true);
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
                        const ev = new Event("stories:open-create-overlay");
                        document.dispatchEvent(ev);
                        return;
                      }
                      const id = `draft-${Date.now()}`;
                      flushSync(() => {
                        setDraftId(id);
                        setEditingId(id);
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
            <div className={classes.listWrap}>
              {listWithNoDupes.map((s) => {
                const idStr = String(s.id);
                const isEditingThis = String(editingId) === idStr;
                const mobileSelected = isMobileDevice() && isModalOpen && selectedId === s.id;

                return (
                  <StoryCard
                    key={s.id}
                    {...s}
                    isHighlighted={false}
                    isEditing={isEditingThis}
                    onBeginRename={() => beginRename(s.id, s.title)}
                    onSubmitTitle={(id, value) =>
                      s._draft ? submitDraft(value) : submitRename(id, value, s.title)
                    }
                    onCancelEdit={() => {
                      if (s._draft) {
                        setEditingId(null);
                        setDraftId(null);
                      } else if (isEditingThis) {
                        finishEditing(s.id);
                      }
                    }}
                    /* десктоп: клик по ⋮ */
                    onOpenMenu={(ev) => openMenuAt(ev, s.id)}
                    menuPinned={isModalOpen && selectedId === s.id && !isMobileDevice()}
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
              mobile={isMobileDevice()}
              anchorRect={anchorRect}
              overlayMeta={overlayMeta}
              selectedId={selectedId}
              onMobileEditSubmit={(nextTitle) => submitRename(selectedId, nextTitle)}
            />
          )}

          {/* оверлей создания — сразу режим редактирования (моб.) */}
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
