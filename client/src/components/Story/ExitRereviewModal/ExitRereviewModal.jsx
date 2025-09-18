// client/src/components/Story/ExitRereviewModal/ExitRereviewModal.jsx
import { useEffect } from 'react';
import classes from './ExitRereviewModal.module.css';

export default function ExitRereviewModal({ open, onStay, onActivate }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onStay?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onStay]);

  if (!open) return null;

  return (
    <div className={classes.overlay} onMouseDown={onStay}>
      <div
        className={classes.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        aria-describedby="exit-desc"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={classes.icon} aria-hidden>✳️</div>
        <h1 id="exit-title" className={classes.title}>Вы внесли изменения</h1>
        <p id="exit-desc" className={classes.text}>
          Все идеи теперь без нулей. Сделать историю активной?
        </p>

        <div className={classes.actions}>
          <button type="button" className={classes.secondaryBtn} onClick={onStay}>
            Остаться
          </button>
          <button type="button" className={classes.primaryBtn} onClick={onActivate}>
            Сделать активной
          </button>
        </div>
      </div>
    </div>
  );
}
