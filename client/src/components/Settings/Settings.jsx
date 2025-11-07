import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import classes from "./Settings.module.css";

export default function Settings({ open, onClose, position, onLogout }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    try {
      if (open) {
        if (!el.open) el.showModal();
      } else {
        if (el.open) el.close();
      }
    } catch {}
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onBackdrop = (e) => { if (e.target === el) onClose?.(); };
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) {
      el.addEventListener("click", onBackdrop);
      window.addEventListener("keydown", onEsc);
    }
    return () => {
      el?.removeEventListener("click", onBackdrop);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  const top   = typeof position?.y === "number" ? `${position.y}px` : position?.y;
  const left  = typeof position?.x === "number" ? `${position.x}px` : position?.x;
  const width = typeof position?.width === "number" ? `${position.width}px` : position?.width;

  const hasAnchor =
    Number.isFinite(position?.x) &&
    Number.isFinite(position?.y) &&
    Number.isFinite(position?.width) &&
    (position.x !== 0 || position.y !== 0);

  return createPortal(
    <dialog ref={dialogRef} className={classes.dialog} aria-label="Настройки">
      {/* Popover (desktop) */}
      <div
        className={`${classes.popover} ${!hasAnchor ? classes.popoverNoAnchor : ""}`}
        role="menu"
        aria-hidden={false}
        style={hasAnchor ? { top, left, width } : undefined}
      >
        <button type="button" className={classes.item} onClick={onLogout} role="menuitem">
          <IoLogOutOutline className={classes.icon} />
          <span className={classes.label}>Выйти</span>
        </button>
      </div>

      {/* Fullscreen sheet (mobile) */}
      <div className={classes.sheet} aria-hidden={false}>
        <div className={classes.sheetHeader}>
          <div className={classes.sheetTitle}>Настройки</div>
          <button className={classes.sheetClose} onClick={onClose} aria-label="Закрыть">
            <FiX />
          </button>
        </div>

        <div className={classes.sheetBody}>
          <button type="button" className={classes.row} onClick={onLogout}>
            <IoLogOutOutline className={classes.rowIcon} />
            <span className={classes.rowLabel}>Выйти</span>
          </button>
        </div>
      </div>
    </dialog>,
    document.getElementById("settings")
  );
}
