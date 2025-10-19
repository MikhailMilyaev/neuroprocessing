import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from '../../utils/context';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_KEY } from '../../http';           

export default function AdminRoute({ children }) {
  const { user } = useContext(Context);
  const location = useLocation();

  if (!user.isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const t = localStorage.getItem(ACCESS_KEY);
    const role = t ? jwtDecode(t)?.role : 'USER';
    if (role === 'ADMIN') return children;
  } catch {}

  return <Navigate to="/stories" replace />;
}
