// src/components/Practices/PracticeModal/PracticeModal.jsx
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import classes from "./PracticeModal.module.css";
import { MdDeleteOutline } from "react-icons/md";

const suppressNextTap = (ms = 700) => {
  try {
    window.__storiesSuppressTapUntil = performance.now() + ms;
  } catch {}
};

const clearNativeSelection = () => {
  try {
    const sel = window.getSelection?.();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
  } catch {}
  try {
    document.activeElement?.blur?.();
  } catch {}
};

const PracticeModal = ({
  open,
  position,
  onClose,
  onDelete,
  mobile = false,
  anchorRect = null,
  overlayMeta = null,
}) => {
  const popRef = useRef(null);
  const ghostRef = useRef(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [ready, setReady] = useState(false);

  // Лочим скролл + запрещаем выделение
  useEffect(() => {
    if (!open) return;
    clearNativeSelection();

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOv = html.style.overflow;
    const prevBodyOv = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.classList.add(classes.noSelect);
    body.classList.add(classes.noSelect);
    return () => {
      html.style.overflow = prevHtmlOv;
      body.style.overflow = prevBodyOv;
      html.classList.remove(classes.noSelect);
      body.classList.remove(classes.noSelect);
      clearNativeSelection();
    };
  }, [open]);

  // Закрытие по клику/тапу вне
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const pop = popRef.current;
      const ghost = mobile ? ghostRef.current : null;
      const t = e.target;
      const inPop = pop && pop.contains(t);
      const inGhost = ghost && ghost.contains(t);
      if (!inPop && !inGhost) {
        e.preventDefault();
        e.stopPropagation();
        suppressNextTap();
        onClose?.();
      }
    };
    const onClick = (e) => {
      const pop = popRef.current;
      const ghost = mobile ? ghostRef.current : null;
      const t = e.target;
      const inPop = pop && pop.contains(t);
      const inGhost = ghost && ghost.contains(t);
      if (!inPop && !inGhost) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [open, mobile, onClose]);

  // Позиционирование
  useEffect(() => {
    if (!open) return;
    setReady(false);
    const el = popRef.current;
    if (!el) return;
    const pad = 8;

    if (!mobile) {
      let x = position?.x ?? pad;
      let y = position?.y ?? pad;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (x + r.width > window.innerWidth - pad)
          x = window.innerWidth - r.width - pad;
        if (y + r.height > window.innerHeight - pad)
          y = window.innerHeight - r.height - pad;
        if (x < pad) x = pad;
        if (y < pad) y = pad;
        setPos({ x, y });
        setReady(true);
      });
      return;
    }

    const a = anchorRect;
    let x = pad,
      y = pad;
    if (a) {
      x = Math.min(a.left + a.width - 220, window.innerWidth - 220 - pad);
      if (x < pad) x = pad;
      el.style.left = `${x}px`;
      el.style.top = `-9999px`;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - (a.top + a.height);
        const spaceAbove = a.top;
        if (spaceBelow < r.height + 12 && spaceAbove >= r.height + 12) {
          y = Math.max(a.top - r.height - 12, pad);
        } else {
          y = Math.min(
            a.top + a.height + 12,
            window.innerHeight - r.height - pad
          );
        }
        setPos({ x, y });
        setReady(true);
      });
    } else {
      // Fallback: центр по вьюпорту (не левый верх)
      el.style.left = `-9999px`;
      el.style.top = `-9999px`;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        let cx = Math.max(pad, Math.round((window.innerWidth - r.width) / 2));
        let cy = Math.max(pad, Math.round((window.innerHeight - r.height) / 2));
        cx = Math.min(cx, window.innerWidth - r.width - pad);
        cy = Math.min(cy, window.innerHeight - r.height - pad);
        setPos({ x: cx, y: cy });
        setReady(true);
      });
    }
  }, [open, mobile, position, anchorRect]);

  if (!open) return null;

  const onDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose?.(); // закрыть меню сразу
    suppressNextTap();
    setTimeout(() => {
      onDelete?.();
    }, 0);
  };

  const content = (
    <div
      ref={popRef}
      className={`${classes.pop} ${
        mobile ? classes.popMobile : ""
      } ${ready ? classes.ready : classes.hidden}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button className={classes.item} onClick={onDeleteClick} role="menuitem">
        <MdDeleteOutline className={classes.iconDanger} />
        <span className={classes.labelDanger}>Удалить</span>
      </button>
    </div>
  );

  const ghostStyle = anchorRect
    ? {
        left: `${Math.max(0, anchorRect.left)}px`,
        top: `${Math.max(0, anchorRect.top)}px`,
        width: `${anchorRect.width}px`,
        height: `${anchorRect.height}px`,
      }
    : undefined;

  return createPortal(
    <>
      {mobile && (
        <>
          <div
            className={classes.backdrop}
            aria-hidden
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              suppressNextTap();
              onClose?.();
            }}
          />
          <div
            ref={ghostRef}
            className={classes.selectedGhost}
            style={ghostStyle}
            aria-hidden={false}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={classes.ghostCol}>
              <span className={classes.ghostTitle}>
                {overlayMeta?.title || ""}
              </span>
              <span className={classes.ghostIdea}>
                {overlayMeta?.idea || "—"}
              </span>
            </div>
            {!!overlayMeta?.time && (
              <span className={classes.ghostTime}>{overlayMeta.time}</span>
            )}
          </div>
        </>
      )}
      {content}
    </>,
    // ⬇️ используем отдельный контейнер для практик
    document.getElementById("practicesModal")
  );
};

export default PracticeModal;
