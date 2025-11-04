import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AddIdeaModal.module.css";

export default function AddIdeaModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState("");

  // Закрытие по ESC и по клику на фон
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // Лочим скролл страницы, пока открыта модалка
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

  const submit = (e) => {
    e?.preventDefault?.();
    const value = text.trim();
    if (value) onSubmit?.(value);
    setText("");
    onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <form className={styles.modal} onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <div className={styles.title}>Шаблон&nbsp;«Хорошо — Плохо»</div>
          <button type="button" className={styles.x} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <input
          type="text"
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сформулируйте идею"
          autoFocus
        />

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>Отмена</button>
          <button type="submit" className={styles.btnPrimary}>Запустить</button>
        </div>
      </form>
    </div>,
    document.getElementById("practicesModal")
  );
}
