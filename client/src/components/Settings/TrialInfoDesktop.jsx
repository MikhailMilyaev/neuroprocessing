import { useEffect, useState } from 'react';
import { getMe } from '../../http/userApi';
import s from './TrialInfoDesktop.module.css';

export default function TrialInfoDesktop() {
  const [data, setData] = useState({ endsAt: null, status: null, loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (!alive) return;
        setData({
          endsAt: me?.user?.trialEndsAt || null,
          status: me?.user?.subscriptionStatus || null,
          loading: false,
        });
      } catch {
        if (alive) setData((d) => ({ ...d, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, []);

  if (data.loading) return null;
  if (data.status === 'active') return null;

  return (
    <div className={s.card} role="note" aria-label="Информация о пробном доступе">
      <div className={s.title}>Пробный доступ</div>
      <div className={s.text}>
        {data.endsAt
          ? <>Открыт до: <b>{new Date(data.endsAt).toLocaleString()}</b></>
          : <>Истёк</>}
      </div>
    </div>
  );
}
