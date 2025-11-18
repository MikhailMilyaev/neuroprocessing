import { useEffect, useCallback } from 'react';
import classes from '../CompleteModal/CompleteModal.module.css';

export default function ReevaluateModal({
  open,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  const handleOverlayClick = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  if (!open) return null;

  return (
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div
        className={classes.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reeval-title"
        aria-describedby="reeval-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={classes.icon} aria-hidden>🔁</div>
        <h1 id="reeval-title" className={classes.title}>
          Переоценить идеи истории?
        </h1>

        <p id="reeval-desc" className={classes.text}>
          Мы сбросим оценки всех активных идей, чтобы вы могли оценить их заново.
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
            Переоценить
          </button>
        </div>
      </div>
    </div>
  );
}
