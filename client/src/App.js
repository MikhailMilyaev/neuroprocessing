// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { authRoutes, publicRoutes } from './routes';
import { useContext, useEffect, useState } from 'react';
import { Context } from './index';
import { check } from './http/userApi';
import { observer } from 'mobx-react-lite';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute'; // ⬅️ добавили
import FullScreenLoader from './components/FullScreenLoader/FullScreenLoader';

const App = observer(() => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      user.setIsAuth(false);
      setLoading(false);
      return;
    }
    check(user)
      .catch(() => user.setIsAuth(false))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <PublicOnlyRoute>
              {element}
            </PublicOnlyRoute>
          }
        />
      ))}

      {authRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              {element}
            </ProtectedRoute>
          }
        />
      ))}
    </Routes>
  );
});

export default App;
