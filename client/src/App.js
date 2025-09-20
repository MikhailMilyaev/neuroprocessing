import { Routes, Route } from 'react-router-dom';
import { authRoutes, publicRoutes } from './routes';
import { useContext, useEffect, useState } from 'react';
import { Context } from './index';
import { check, refreshTokens } from './http/userApi';
import { observer } from 'mobx-react-lite';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import FullScreenLoader from './components/FullScreenLoader/FullScreenLoader';
import { ACCESS_KEY, REFRESH_KEY } from './http';

const App = observer(() => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const access  = localStorage.getItem(ACCESS_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);

      try {
        if (!access && refresh) {
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
        <Route key={path} path={path} element={<PublicOnlyRoute>{element}</PublicOnlyRoute>} />
      ))}
      {authRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
      ))}
    </Routes>
  );
});

export default App;
