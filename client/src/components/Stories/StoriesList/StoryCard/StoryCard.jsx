import classes from "./StoryCard.module.css";
import { useNavigate } from "react-router-dom";
import { STORY_ROUTE } from "../../../../utils/consts";
import { useMemo, useRef, useState, useEffect } from "react";
import { BsThreeDots } from "react-icons/bs";

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

export default function StoryCard({
  id,
  slug,
  title,
  updatedAt,
  updated_at,
  createdAt,
  created_at,
  isHighlighted,
  isEditing = false,
  onBeginRename,
  onSubmitTitle,
  onCancelEdit,
  onOpenMenu,
  menuPinned = false,
  onLongPressMobile,
  mobileContextActive = false
}) {
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const inputRef = useRef(null);

  const rawTs = updatedAt ?? updated_at ?? createdAt ?? created_at;

  const [optimisticTitle, setOptimisticTitle] = useState(null);
  useEffect(() => {
    if ((title || "").trim()) setOptimisticTitle(null);
  }, [title]);

  const editedLabel = useMemo(() => {
    if (isEditing) return "";
    const src = rawTs ?? new Date();
    return formatEditedAt(src);
  }, [isEditing, rawTs]);

  const isMobile = () =>
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  const [value, setValue] = useState(title || "");
  useEffect(() => {
    if (isEditing) setValue(title || "");
  }, [isEditing, title]);

  const viewTitle = optimisticTitle ?? title ?? "";
  const hasViewTitle = !!viewTitle.trim();
  const displayTitle = hasViewTitle ? viewTitle : "Сформулируйте проблему";
  const targetUrl = `${STORY_ROUTE}/${slug || id}`;

  useEffect(() => {
    if (!isEditing) return;
    let af1 = 0, af2 = 0;
    af1 = requestAnimationFrame(() => {
      af2 = requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        try { el.focus({ preventScroll: true }); } catch { el.focus(); }
        const len = el.value.length;
        try { el.setSelectionRange(len, len); } catch {}
      });
    });
    return () => { cancelAnimationFrame(af1); cancelAnimationFrame(af2); };
  }, [isEditing]);

  const onRowClick = (e) => {
    if (isEditing) return;
    const suppress =
      typeof window !== "undefined" &&
      window.__storiesSuppressTapUntil &&
      performance.now() < window.__storiesSuppressTapUntil;
    if (suppress) { e.preventDefault?.(); return; }
    if (isMobile() && mobileContextActive) {
      e.preventDefault();
      return;
    }
    navigate(targetUrl);
  };
  const onRowKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(e); }
  };

  const onContext = (e) => { e.preventDefault(); };

  const commit = () => {
    const t = (value ?? "").trim();
    if (!t) {
      onSubmitTitle?.(id, "");
      onCancelEdit?.(id);
      return;
    }
    setOptimisticTitle(t);
    onSubmitTitle?.(id, t);
    onCancelEdit?.(id);
  };
  const onInputKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); onCancelEdit?.(id); }
  };

  /* ===== Long press (только мобила) ===== */
  const lpTimerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const movedFar = useRef(false);

  const clearLp = () => { if (lpTimerRef.current) { clearTimeout(lpTimerRef.current); lpTimerRef.current = null; } };

  const onTouchStart = (e) => {
    if (!isMobile() || isEditing) return;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    movedFar.current = false;

    const el = btnRef.current;
    const rect = el?.getBoundingClientRect?.();

    clearLp();
    lpTimerRef.current = setTimeout(() => {
      onLongPressMobile?.(id, rect);
      try { navigator.vibrate?.(10); } catch {}
    }, 350);
  };

  const onTouchMove = (e) => {
    if (!isMobile() || !lpTimerRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - startPos.current.x);
    const dy = Math.abs(t.clientY - startPos.current.y);
    if (dx > 8 || dy > 8) {
      movedFar.current = true;
      clearLp();
    }
  };

  const onTouchEnd = () => {
    if (!isMobile()) return;
    const suppress =
      typeof window !== "undefined" &&
      window.__storiesSuppressTapUntil &&
      performance.now() < window.__storiesSuppressTapUntil;
    if (suppress) return;
    clearLp();
    if (!movedFar.current && !mobileContextActive) {
      navigate(targetUrl);
    }
  };

  const onTouchCancel = clearLp;

  const showTime = !isEditing && !!rawTs;

  return (
    <div className={classes.row}>
      {isEditing ? (
        <div
          ref={btnRef}
          className={`${classes.storyCard} ${classes.editingMode}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          data-story-id={id}
        >
          <input
            ref={inputRef}
            className={classes.titleInput}
            placeholder="Сформулируйте проблему"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={onInputKeyDown}
            type="text"
            inputMode="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            enterKeyHint="done"
            aria-label="Заголовок истории"
            autoFocus
          />
        </div>
      ) : (
        <div
          ref={btnRef}
          className={`${classes.storyCard} ${isHighlighted ? classes.storyCardActive : ""} ${mobileContextActive ? classes.storyCardSelected : ""}`}
          role="button"
          tabIndex={0}
          onKeyDown={onRowKey}
          onClick={onRowClick}
          onContextMenu={onContext}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          data-story-id={id}
        >
          <>
            <span className={`${classes.titleText} ${!hasViewTitle ? classes.placeholderText : ""}`}>
              {displayTitle}
            </span>

            {showTime && (
              <span className={`${classes.timeRight} ${menuPinned ? classes.timeHidden : ""}`}>
                {editedLabel}
              </span>
            )}

            {/* ⋮ — десктоп */}
            <button
              type="button"
              className={`${classes.kebabBtn} ${menuPinned ? classes.kebabPinned : ""}`}
              aria-label="Ещё"
              onClick={(ev) => {
                ev.stopPropagation();
                onOpenMenu?.(ev);
              }}
            >
              <BsThreeDots className={classes.kebabIcon} />
            </button>
          </>
        </div>
      )}
    </div>
  );
}
