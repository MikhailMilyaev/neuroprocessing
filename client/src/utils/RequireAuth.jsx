import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getMe } from '../http/userApi';
import { LOGIN_ROUTE } from '../utils/consts';
import { jwtDecode } from 'jwt-decode';

export default function RequireAuth({ children }) {
  const [st, setSt] = useState({ loading: true, ok: false });
  const loc = useLocation();

  useEffect(() => {
    const access = typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null;
    if (!access) { setSt({ loading: false, ok: false }); return; }
    try {
      const { exp } = jwtDecode(access);
      if (!exp || exp * 1000 <= Date.now()) {
        try { localStorage.removeItem('access'); } catch {}
        setSt({ loading: false, ok: false });
        return;
      }
    } catch {
      try { localStorage.removeItem('access'); } catch {}
      setSt({ loading: false, ok: false });
      return;
    }
    // токен есть и живой — валидируем на сервере
    let alive = true;
    (async () => {
      try { await getMe(); if (alive) setSt({ loading: false, ok: true }); }
      catch { if (alive) setSt({ loading: false, ok: false }); }
    })();
    return () => { alive = false; };
  }, []);

  if (st.loading) return null;
  if (!st.ok) return <Navigate to={LOGIN_ROUTE} state={{ from: loc }} replace />;
  return children;
}
