// src/components/PublicOnlyRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from '../index';
import { observer } from 'mobx-react-lite';

const PublicOnlyRoute = observer(({ children }) => {
  const { user } = useContext(Context);
  const location = useLocation();

  // Если уже авторизован — не пускаем на публичные страницы
  if (user.isAuth) {
    return <Navigate to="/stories" state={{ from: location }} replace />;
  }
  return children;
});

export default PublicOnlyRoute;
