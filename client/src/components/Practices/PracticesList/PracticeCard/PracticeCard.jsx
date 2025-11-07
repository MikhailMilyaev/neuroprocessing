import classes from "./PracticeCard.module.css";
import { useMemo, useRef } from "react";
import { BsThreeDots } from "react-icons/bs";

const titleBySlug = (slug) =>
  slug === "good-bad" ? "Хорошо — Плохо" : String(slug || "").trim();

const toDate = (v) => (v ? new Date(v) : null);

const formatEditedAt = (raw) => {
  const d = toDate(raw);
  if (!d) return "";
  const n = new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const y = new Date(t);
  y.setDate(t.getDate() - 1);
  if (d >= t)
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  if (d >= y && d < t) return "Вчера";
  return `${String(d.getDate()).padStart(2, "0")}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${d.getFullYear()}`;
};

export default function PracticeCard({
  run,
  onOpen,
  onOpenMenu,
  menuPinned = false,
  onLongPressMobile,
  mobileContextActive = false,
}) {
  const { id, practiceSlug, ideaText, updatedAt, updated_at, createdAt, created_at } =
    run || {};
  const btnRef = useRef(null);

  const rawTs = updatedAt ?? updated_at ?? createdAt ?? created_at;
  const editedLabel = useMemo(() => formatEditedAt(rawTs), [rawTs]);

  const isMobile = () =>
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  // ===== long-press (мобилка) =====
  const lpTimerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const movedFar = useRef(false);
  const clearLp = () => {
    if (lpTimerRef.current) {
      clearTimeout(lpTimerRef.current);
      lpTimerRef.current = null;
    }
  };

  const onTouchStart = (e) => {
    if (!isMobile()) return;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    movedFar.current = false;
    const el = btnRef.current;
    const rect = el?.getBoundingClientRect?.();
    clearLp();
    lpTimerRef.current = setTimeout(() => {
      onLongPressMobile?.(id, rect);
      try {
        navigator.vibrate?.(10);
      } catch {}
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
    clearLp();
    if (!movedFar.current && !mobileContextActive) onOpen?.();
  };

  const onTouchCancel = clearLp;

  const onRowClick = (e) => {
    const suppress =
      typeof window !== "undefined" &&
      window.__storiesSuppressTapUntil &&
      performance.now() < window.__storiesSuppressTapUntil;
    if (suppress) {
      e.preventDefault?.();
      return;
    }

    if (isMobile() && mobileContextActive) {
      e.preventDefault();
      return;
    }
    onOpen?.();
  };

  const onContext = (e) => e.preventDefault();

  const idea = (ideaText || "").trim();

  return (
    <div className={classes.row}>
      <div
        ref={btnRef}
        className={`${classes.card} ${
          mobileContextActive ? classes.cardSelected : ""
        }`}
        role="button"
        tabIndex={0}
        onClick={onRowClick}
        onContextMenu={onContext}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        data-practice-id={id}
      >
        <>
          <span className={classes.titleTop}>
            {titleBySlug(practiceSlug)}
          </span>

          <span
            className={`${classes.subtitleIdea} ${
              !idea ? classes.placeholderText : ""
            }`}
          >
            {idea || "—"}
          </span>

          {!!rawTs && (
            <span
              className={`${classes.timeRight} ${
                menuPinned ? classes.timeHidden : ""
              }`}
            >
              {editedLabel}
            </span>
          )}

          {/* ⋮ — десктоп */}
          <button
            type="button"
            className={`${classes.kebabBtn} ${
              menuPinned ? classes.kebabPinned : ""
            }`}
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
    </div>
  );
}
