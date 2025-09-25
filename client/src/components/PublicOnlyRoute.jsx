import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from '../context';
import { observer } from 'mobx-react-lite';

const PublicOnlyRoute = observer(({ children }) => {
  const { user } = useContext(Context);
  const location = useLocation();

  if (user.isAuth) {
    return <Navigate to="/stories" state={{ from: location }} replace />;
  }
  return children;
});

export default PublicOnlyRoute;
