import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import classes from './ResetSent.module.css';

function getWebmailUrl(email = '') {
  const domain = (email.split('@')[1] || '').toLowerCase();
  if (domain.endsWith('yandex.ru') || domain.endsWith('ya.ru')) return 'https://mail.yandex.ru';
  if (domain.endsWith('gmail.com')) return 'https://mail.google.com';
  if (domain.endsWith('mail.ru')) return 'https://e.mail.ru';
  if (domain.endsWith('outlook.com') || domain.endsWith('hotmail.com') || domain.endsWith('live.com'))
    return 'https://outlook.live.com/mail';
  if (domain.endsWith('icloud.com')) return 'https://www.icloud.com/mail';
  if (domain.endsWith('yahoo.com')) return 'https://mail.yahoo.com';
  if (domain) return `https://mail.${domain}`;
  return 'about:blank';
}

const ResetSent = () => {
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const [email] = useState(emailFromState || sessionStorage.getItem('pendingEmail') || '');

  const webmailUrl = useMemo(() => getWebmailUrl(email), [email]);
  const canOpenWebmail = Boolean(email) && webmailUrl !== 'about:blank';

  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <div className={classes.icon} aria-hidden>📩</div>
        <h1 className={classes.title}>Проверьте почту</h1>
        <p className={classes.text}>
          Мы отправили ссылку для восстановления пароля
          {email ? <> на&nbsp;<strong className={classes.email}>{email}</strong></> : ''}.
        </p>

        <div className={classes.actions}>
          {canOpenWebmail ? (
            <a
              className={classes.primaryBtn}
              href={webmailUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть почту
            </a>
          ) : null}
        </div>

        <p className={classes.hint}>
          Если письма нет, проверьте папку «Спам».
        </p>
      </div>
    </div>
  );
};

export default ResetSent;
