import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resetPasswordGate } from '../../../../http/userApi';
import ResetPassword from './ResetPassword';
import { NOTFOUND_ROUTE } from '../../../../utils/consts';

const ResetPasswordGate = () => {
  const { search } = useLocation();
  const pr = new URLSearchParams(search).get('pr');
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!pr) { setAllowed(false); return; }
    let off = false;
    (async () => {
      try {
        const { data } = await resetPasswordGate(pr);
        if (!off) setAllowed(Boolean(data?.ok));
      } catch { if (!off) setAllowed(false); }
    })();
    return () => { off = true; };
  }, [pr]);

  if (allowed === null) return null;
  if (!allowed) return <Navigate to={NOTFOUND_ROUTE} replace />;
  return <ResetPassword />;
};

export default ResetPasswordGate;
