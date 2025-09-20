import s from './UnarchivedBanner.module.css';

export default function UnarchivedBanner({ title, onShowInList, onClose }) {
  return (
    <div className={s.inlineBanner} role="status" aria-live="polite">
      <div className={s.inlineText}>
        История{title ? <> «<b>{title}</b>»</> : null} стала активной.
      </div>
      <div className={s.inlineActions}>
        <button type="button" className={s.inlineBtn} onClick={onShowInList}>
          Показать в списке
        </button>
        <button type="button" className={s.inlineBtnSecondary} onClick={onClose}>
          Скрыть
        </button>
      </div>
    </div>
  );
}
