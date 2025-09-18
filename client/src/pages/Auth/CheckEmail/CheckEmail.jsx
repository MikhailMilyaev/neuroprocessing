import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton';
import Toast from '../../../components/Toast/Toast';
import { resendVerification, getVerifyStatus } from '../../../http/userApi';
import classes from './CheckEmail.module.css';

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

const RESEND_KEY = 'verifyResendAllowedAt';

const CheckEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const [email] = useState(emailFromState || sessionStorage.getItem('pendingEmail') || '');

  const [ready, setReady] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [supportMode, setSupportMode] = useState(false);

  // Тост
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [toastKey, setToastKey] = useState(0);
  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastKey((k) => k + 1); // продлеваем/обновляем таймер без входной анимации
  };

  const webmailUrl = useMemo(() => getWebmailUrl(email), [email]);

  const mmss = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!email) navigate('/404', { replace: true });
  }, [email, navigate]);

  // первичная загрузка статуса
  useEffect(() => {
    if (!email) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await getVerifyStatus(email);
        if (!data?.ok) {
          navigate('/404', { replace: true });
          return;
        }

        if (!mounted) return;
        setSupportMode(Boolean(data.support));

        const left = Number(data.cooldownLeft) || 0;
        if (left > 0) {
          const until = Date.now() + left * 1000;
          sessionStorage.setItem(RESEND_KEY, String(until));
          setCooldown(left);
        } else {
          const stored = Number(sessionStorage.getItem(RESEND_KEY) || 0);
          const now = Date.now();
          setCooldown(stored > now ? Math.ceil((stored - now) / 1000) : 0);
        }

        setReady(true);
      } catch {
        navigate('/404', { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [email, navigate]);

  // тикаем кулдаун
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || loading || supportMode) return;

    setLoading(true);
    try {
      await resendVerification(email);

      sessionStorage.removeItem(RESEND_KEY);
      setCooldown(0);
      setSupportMode(true);
      showToast('Письмо отправлено', 'success');
    } catch (e) {
      sessionStorage.removeItem(RESEND_KEY);
      setCooldown(0);
      setSupportMode(true);

      const msg =
        e?.response?.data?.message ||
        'Ошибка отправки письма. Свяжитесь с поддержкой.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <div className={classes.icon} aria-hidden>📧</div>
        <h1 className={classes.title}>Подтвердите почту</h1>

        <p className={classes.text}>
          Мы отправили ссылку на&nbsp;<strong className={classes.email}>{email}</strong>.
        </p>

        <div className={classes.actions}>
          <a className={classes.primaryBtn} href={webmailUrl} target="_blank" rel="noopener noreferrer">
            Открыть почту
          </a>

          {supportMode ? (
            <a
              className={classes.primaryBtn}
              href="https://t.me/pinky589"
              target="_blank"
              rel="noopener noreferrer"
            >
              Связаться с поддержкой
            </a>
          ) : cooldown > 0 ? (
            <div className={classes.cooldown}>
              Отправить новое письмо через <span className={classes.time}>{mmss(cooldown)}</span>
            </div>
          ) : (
            <SubmitButton onSubmit={handleResend} isLoading={loading}>
              Отправить новое письмо
            </SubmitButton>
          )}
        </div>

        <p className={classes.hint}>Если письма нет, проверьте папку «Спам».</p>
      </div>

      <Toast
        message={toastMsg}
        type={toastType}
        duration={3000}
        version={toastKey}
        placement="top"
      />
    </div>
  );
};

export default CheckEmail;
