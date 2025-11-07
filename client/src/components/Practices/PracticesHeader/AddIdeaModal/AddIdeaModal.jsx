import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AddIdeaModal.module.css";

export default function AddIdeaModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  // ESC
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // Лочим скролл страницы
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  // Автофокус + поднять клавиатуру (мобилка)
  useEffect(() => {
    if (!open) return;
    const el = inputRef.current;
    if (!el) return;

    // фокус сразу (работает как на iOS, так и на Android)
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }
    try { el.setSelectionRange(el.value.length, el.value.length); } catch {}
    // дополнительный "тык" — помогает iOS
    try { el.click(); } catch {}

    // подстрахуемся ещё через кадр
    const r = requestAnimationFrame(() => {
      try { el.focus({ preventScroll: true }); } catch {}
      try { el.click(); } catch {}
    });
    return () => cancelAnimationFrame(r);
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
    <div
      className={styles.overlay}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="addTitle"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div id="addTitle" className={styles.title}>Шаблон&nbsp;«Хорошо — Плохо»</div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Закрыть"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сформулируйте идею"
          inputMode="text"
          enterKeyHint="done"
          autoCapitalize="sentences"
          autoCorrect="on"
        />

        <div className={styles.footer}>
          <button type="submit" className={styles.primaryBtn}>Запустить</button>
        </div>
      </form>
    </div>,
    document.getElementById("practicesModal")
  );
}
