import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { STORIES_ROUTE, ADMIN_ROUTE } from '../utils/consts';
import { jwtDecode } from 'jwt-decode';

export default function PublicOnly({ children }) {
  const [st, setSt] = useState({ loading: true, authed: false, role: 'USER' });

  useEffect(() => {
    // 1) смотрим локально токен
    const access = typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null;
    if (!access) {
      setSt({ loading: false, authed: false, role: 'USER' });
      return;
    }
    // 2) проверяем exp
    try {
      const { exp, role } = jwtDecode(access);
      const expired = !exp || exp * 1000 <= Date.now();
      if (expired) {
        try { localStorage.removeItem('access'); } catch {}
        setSt({ loading: false, authed: false, role: 'USER' });
        return;
      }
      // 3) токен валидный — считаем авторизован
      setSt({ loading: false, authed: true, role: role || 'USER' });
    } catch {
      try { localStorage.removeItem('access'); } catch {}
      setSt({ loading: false, authed: false, role: 'USER' });
    }
  }, []);

  if (st.loading) return null;
  if (!st.authed) return children;
  return <Navigate to={st.role === 'ADMIN' ? ADMIN_ROUTE : STORIES_ROUTE} replace />;
}
