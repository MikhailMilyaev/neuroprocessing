import { useEffect, useState } from 'react';
import { getMe } from '../http/userApi';

export default function useTrialGate(disabled = false) {
  const [state, setState] = useState({ loading: !disabled, isExpired: false, endsAtISO: null });

  useEffect(() => {
    if (disabled) {
      setState({ loading: false, isExpired: false, endsAtISO: null });
      return;
    }
    // если нет access — даже не ходим на /me
    const access = typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null;
    if (!access) {
      setState({ loading: false, isExpired: false, endsAtISO: null });
      return;
    }

    let alive = true;
    (async () => {
      try {
        const me = await getMe(); // $authHost
        if (!alive) return;

        const u = me?.user || {};
        const now = Date.now();
        const status = u.subscriptionStatus;

        const trialEnds = u.trialEndsAt ? new Date(u.trialEndsAt).getTime() : null;
        const subEnds   = u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).getTime() : null;

        let isExpired = false;
        let endsAtISO = null;

        if (status === 'expired') {
          isExpired = true;
          endsAtISO = (subEnds || trialEnds) ? new Date(subEnds || trialEnds).toISOString() : null;
        } else if (status === 'trial') {
          isExpired = !trialEnds || now >= trialEnds;
          endsAtISO = u.trialEndsAt || null;
        } else if (status === 'active') {
          isExpired = !!(subEnds && now >= subEnds);
          endsAtISO = u.subscriptionEndsAt || null;
        }

        setState({ loading: false, isExpired, endsAtISO });
      } catch {
        // если не авторизован — не блокируем
        setState({ loading: false, isExpired: false, endsAtISO: null });
      }
    })();

    return () => { alive = false; };
  }, [disabled]);

  return state;
}
