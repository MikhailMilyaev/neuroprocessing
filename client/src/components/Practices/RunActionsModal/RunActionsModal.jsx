import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./RunActionsModal.module.css";

export default function RunActionsModal({ open, run, onClose, onDelete }) {

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <div className={styles.title}>Подтверждение</div>
          <button type="button" className={styles.x} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.key}>Практика</div>
            <div className={styles.val}>Хорошо - Плохо</div>
          </div>
          <div className={styles.row}>
            <div className={styles.key}>Идея</div>
            <div className={styles.val}>{run?.ideaText || "—"}</div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>Отмена</button>
          <button type="button" className={styles.btnDanger} onClick={onDelete}>Удалить</button>
        </div>
      </div>
    </div>,
    document.getElementById("practicesModal")
  );
}
