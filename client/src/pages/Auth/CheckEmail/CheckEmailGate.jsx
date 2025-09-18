import { Navigate, useLocation } from 'react-router-dom';
import CheckEmail from './CheckEmail';
import { NOTFOUND_ROUTE } from '../../../utils/consts';

const CheckEmailGate = () => {
  const location = useLocation();
  const emailFromState = location.state?.email;
  const emailFromSession = typeof window !== 'undefined'
    ? sessionStorage.getItem('pendingEmail')
    : '';

  const email = emailFromState || emailFromSession;

  if (!email) return <Navigate to={NOTFOUND_ROUTE} replace />;

  return <CheckEmail />;
};

export default CheckEmailGate;
