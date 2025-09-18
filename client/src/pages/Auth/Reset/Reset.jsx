import { useEffect, useMemo, useState } from 'react';
import Brand from '../../../components/Auth/Brand/Brand';
import FormInput from '../../../components/Auth/FormInput/FormInput';
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton';
import Toast from '../../../components/Toast/Toast';
import { recoveryRequest } from '../../../http/userApi';
import { useNavigate } from 'react-router-dom';
import { RESET_SENT_ROUTE } from '../../../utils/consts';
import BackBtn from '../../../components/BackBtn/BackBtn';
import classes from './Reset.module.css';

const supKey = (email) => `resetSupportUntil:${(email || '').toLowerCase()}`;
const HOUR_MS = 60 * 60 * 1000;

const pluralHours = (n) => {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'час';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'часа';
  return 'часов';
};

const Reset = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [supportMode, setSupportMode] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastKey, setToastKey] = useState(0);

  const navigate = useNavigate();

  const updateSupportToast = useMemo(() => {
    return (eaddr) => {
      const until = Number(sessionStorage.getItem(supKey(eaddr)) || 0);
      const now = Date.now();
      if (until <= now) {
        setSupportMode(false);
        setToastMsg('');
        sessionStorage.removeItem(supKey(eaddr));
        return;
      }
      const hoursLeft = Math.max(1, Math.ceil((until - now) / HOUR_MS));
      setSupportMode(true);
      setToastType('error');
      setToastMsg(
        `Лимит сброса пароля исчерпан, попробуйте через ${hoursLeft} ${pluralHours(hoursLeft)}.`
      );
      setToastKey((k) => k + 1);
    };
  }, []);

  useEffect(() => {
    if (!email) { setSupportMode(false); setToastMsg(''); return; }
    updateSupportToast(email);
  }, [email, updateSupportToast]);

  useEffect(() => {
    if (!supportMode || !email) return;
    const id = setInterval(() => updateSupportToast(email), 60 * 1000);
    return () => clearInterval(id);
  }, [supportMode, email, updateSupportToast]);

  const submit = async (e) => {
    e.preventDefault();

    const eaddr = (email || '').trim();
    if (!eaddr) {
      setToastType('error');
      setToastMsg('Укажите email');
      setToastKey((k) => k + 1);
      return;
    }
    if (loading) return;

    if (supportMode) {
      updateSupportToast(eaddr);
      return;
    }

    try {
      setLoading(true);
      const { data } = await recoveryRequest(eaddr);

      sessionStorage.setItem('pendingEmail', eaddr);
      navigate(`${RESET_SENT_ROUTE}?rst=${encodeURIComponent(data.rst)}`, { state: { email: eaddr } });
    } catch (e) {
      const status = e?.response?.status;
      const retryAfterSec =
        Number(e?.response?.data?.retryAfter) ||
        Number(e?.response?.headers?.['retry-after']) ||
        0;

      const isDailyLimit = Boolean(e?.response?.data?.support ?? e?.response?.data?.limit ?? false);

      if (status === 429 && isDailyLimit) {
        const until = Date.now() + retryAfterSec * 1000;
        sessionStorage.setItem(supKey(eaddr), String(until));
        updateSupportToast(eaddr); // выставит supportMode и текст с часами
      } else {
        const msg = e?.response?.data?.message || 'Ошибка';
        setToastType('error');
        setToastMsg(msg);
        setToastKey((k) => k + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <BackBtn variant="inline" />
        <Brand />
      </div>

      <form onSubmit={submit}>
        <FormInput
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Электронная почта"
          containerStyle={{ marginBottom: 16 }}
        />

        <Toast
          message={toastMsg}
          type={toastType}
          duration={supportMode ? 0 : 3000}
          version={toastKey}
          placement="top"
        />

        {supportMode ? (
          <a
            className={classes.supportBtn}
            href="https://t.me/pinky589"
            target="_blank"
            rel="noopener noreferrer"
          >
            Связаться с поддержкой
          </a>
        ) : (
          <SubmitButton isLoading={loading}>Отправить</SubmitButton>
        )}
      </form>
    </div>
  );
};

export default Reset;
