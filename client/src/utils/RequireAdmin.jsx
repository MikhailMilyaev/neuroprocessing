import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../http/userApi';
import { STORIES_ROUTE, LOGIN_ROUTE } from '../utils/consts';

export default function RequireAdmin({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (!alive) return;
        const role = me?.user?.role || 'USER';
        setState({ loading: false, ok: role === 'ADMIN' });
      } catch (e) {
        if (!alive) return;
        // если не авторизован — на логин
        setState({ loading: false, ok: false, error: 'unauth' });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) return null; // можно воткнуть спиннер
  if (!state.ok) {
    // если просто не админ — уведём на обычный рабочий экран;
    // если не авторизован — на логин
    return <Navigate to={state.error === 'unauth' ? LOGIN_ROUTE : STORIES_ROUTE} replace />;
  }
  return children;
}
