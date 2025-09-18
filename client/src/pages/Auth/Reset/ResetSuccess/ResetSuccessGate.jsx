import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resetSuccessGate } from '../../../../http/userApi';
import ResetSuccess from './ResetSuccess';
import { NOTFOUND_ROUTE } from '../../../../utils/consts';

const ResetSuccessGate = () => {
  const { search } = useLocation();
  const ps = new URLSearchParams(search).get('ps');
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!ps) { setAllowed(false); return; }
    let off = false;
    (async () => {
      try {
        const { data } = await resetSuccessGate(ps);
        if (!off) setAllowed(Boolean(data?.ok));
      } catch { if (!off) setAllowed(false); }
    })();
    return () => { off = true; };
  }, [ps]);

  if (allowed === null) return null;
  if (!allowed) return <Navigate to={NOTFOUND_ROUTE} replace />;
  return <ResetSuccess />;
};

export default ResetSuccessGate;
