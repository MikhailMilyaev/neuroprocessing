import { createPortal } from 'react-dom';
import styles from './TrialWelcomeModal.module.css';

export default function TrialWelcomeModal({ open, onAcknowledge, days = 5, endsAtISO }) {
  if (!open) return null;
  const node = typeof document !== 'undefined' ? document.getElementById('modals') : null;

  const body = (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Пробный период активирован">
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()} // клики по карточке не сквозные
      >
        <h2 className={styles.title}>Пробный период активирован</h2>

        <p className={styles.text}>
          Вам доступен полный функционал на <b>{days} дней</b>.
          {endsAtISO && (
            <> Завершение: <b>{new Date(endsAtISO).toLocaleString()}</b>.</>
          )}
          {' '}Срок можно посмотреть в разделе «Настройки».
        </p>

        <button type="button" className={styles.ok} onClick={onAcknowledge}>
          Понятно
        </button>
      </div>
    </div>
  );

  return node ? createPortal(body, node) : body;
}
