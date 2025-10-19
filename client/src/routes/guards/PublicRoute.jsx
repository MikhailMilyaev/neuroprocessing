import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { STORIES_ROUTE, ADMIN_ROUTE } from '../../utils/consts';
import { jwtDecode } from 'jwt-decode';

export default function PublicRoute({ children }) {
  const [st, setSt] = useState({ loading: true, authed: false, role: 'USER' });

  useEffect(() => {
    const access = typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null;
    if (!access) { setSt({ loading: false, authed: false, role: 'USER' }); return; }
    try {
      const { exp, role } = jwtDecode(access);
      if (!exp || exp * 1000 <= Date.now()) {
        try { localStorage.removeItem('access'); } catch {}
        setSt({ loading: false, authed: false, role: 'USER' });
        return;
      }
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
