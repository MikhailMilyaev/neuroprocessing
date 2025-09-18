import { useEffect, useCallback } from 'react';
import classes from './CompleteModal.module.css';

export default function CompleteModal({
  open,
  onCancel,
  onConfirm,
}) {
  // блокируем прокрутку фона
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Esc = отмена
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  const handleOverlayClick = useCallback(() => {
    onCancel?.();   // клик по фону = отмена
  }, [onCancel]);

  if (!open) return null;

  return (
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div
        className={classes.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-title"
        aria-describedby="complete-desc"
        onClick={(e) => e.stopPropagation()}  // клики внутри карточки не уходят на оверлей
      >
        <div className={classes.icon} aria-hidden>✅</div>
        <h1 id="complete-title" className={classes.title}>История проработана</h1>

        <p id="complete-desc" className={classes.text}>
          Все идеи имеют нулевой психоэмоциональный заряд.
          <br />
          Мы напомним переоценить весь список идей через <strong>14 дней</strong>.
        </p>

        <div className={classes.actions}>
          <button
            type="button"
            className={classes.secondaryBtn}
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            type="button"
            className={classes.primaryBtn}
            onClick={onConfirm}
          >
            Архивировать
          </button>
        </div>
      </div>
    </div>
  );
}
