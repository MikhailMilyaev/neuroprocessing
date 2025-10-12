import { createPortal } from 'react-dom';
import styles from './TrialExpiredModal.module.css';

export default function TrialExpiredModal({ visible, endsAtISO, telegramUrl, onLogout }) {
  if (!visible) return null;

  const node = typeof document !== 'undefined' ? document.getElementById('modals') : null;

  const body = (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <h2 className={styles.title}>Пробный период закончился</h2>

        {endsAtISO && (
          <p className={styles.note}>
            Доступ был открыт до{' '}
            {new Date(endsAtISO).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        <p className={styles.text}>
          Чтобы продолжить пользоваться сервисом, оплатите подписку.
        </p>

        <div className={styles.actions}>
          <a
            className={styles.cta}
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
          <button className={styles.secondary} onClick={onLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );

  return node ? createPortal(body, node) : body;
}
