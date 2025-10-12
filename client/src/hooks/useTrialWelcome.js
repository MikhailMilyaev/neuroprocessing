// src/hooks/useTrialWelcome.js
import { useEffect, useMemo, useState } from 'react';
import { getMe } from '../http/userApi';

const LS_PREFIX = 'trial_welcome_seen_v1';
const mkKey = (userId, startedAtISO) => `${LS_PREFIX}:${userId}:${startedAtISO || 'na'}`;

export default function useTrialWelcome(disabled = false) {
  const [st, setSt] = useState({
    open: false,
    days: 5,
    endsAtISO: null,
    userId: null,
    trialStartedAtISO: null,
  });

  const close = useMemo(() => () => setSt(s => ({ ...s, open: false })), []);

  useEffect(() => {
    if (disabled) { close(); return; }

    const access = typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null;
    if (!access) { close(); return; }

    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (!alive) return;

        const u = me?.user;
        if (!u) { close(); return; }

        // показываем ТОЛЬКО если активен trial и есть даты
        if (u.subscriptionStatus !== 'trial' || !u.trialStartedAt || !u.trialEndsAt) {
          close();
          return;
        }

        const startedAt = new Date(u.trialStartedAt);
        const endsAt = new Date(u.trialEndsAt);
        const days = Math.max(1, Math.round((endsAt - startedAt) / (24 * 3600 * 1000)));

        // уже показывали?
        const key = mkKey(u.id, startedAt.toISOString());
        const seen = typeof localStorage !== 'undefined' ? localStorage.getItem(key) === '1' : false;

        if (seen) {
          close();
          return;
        }

        // показать и запомнить данные пользователя
        setSt({
          open: true,
          days,
          endsAtISO: endsAt.toISOString(),
          userId: u.id,
          trialStartedAtISO: startedAt.toISOString(),
        });
      } catch {
        close();
      }
    })();

    return () => { alive = false; };
  }, [disabled, close]);

  // Пометка, что модалку уже показали
  const acknowledge = (userId, trialStartedAtISO) => {
    try {
      const key = mkKey(userId, trialStartedAtISO);
      localStorage.setItem(key, '1');
    } catch {}
    close();
  };

  return { ...st, close, acknowledge };
}
