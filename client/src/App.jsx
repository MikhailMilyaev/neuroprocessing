import { Routes, Route } from 'react-router-dom';
import { authRoutes, publicRoutes } from './routes/maps';
import { useContext, useEffect, useState } from 'react';
import { Context } from './utils/context';
import { check, refreshTokens } from './http/userApi';
import { observer } from 'mobx-react-lite';

import ProtectedRoute from './routes/guards/ProtectedRoute';
import PublicRoute from './routes/guards/PublicRoute';
import AdminRoute from './routes/guards/AdminRoute';

import FullScreenLoader from './components/FullScreenLoader/FullScreenLoader';
import { ACCESS_KEY } from './http';

import AppShell from './layout/AppShell';
import AdminShell from './layout/AdminShell';
import { useMetrika } from './hooks/useMetrika';
import { ADMIN_ROUTE } from './utils/consts';

import AdminUsers from './pages/Admin/AdminUsers';  

const YM_ID = 104377537;

const App = observer(() => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);

  useMetrika(YM_ID);

  useEffect(() => {
    (async () => {
      try {
        if (!localStorage.getItem(ACCESS_KEY)) {
          await refreshTokens();
        }
        if (localStorage.getItem(ACCESS_KEY)) {
          await check(user);
        } else {
          user.setIsAuth(false);
        }
      } catch {
        user.setIsAuth(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={<PublicRoute>{element}</PublicRoute>} />
      ))}

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {authRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      <Route
        path={ADMIN_ROUTE}
        element={
          <AdminRoute>
            <AdminShell>
              <AdminUsers />
            </AdminShell>
          </AdminRoute>
        }
      />
    </Routes>
  );
});

export default App;
