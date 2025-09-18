import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resetSentGate } from '../../../../http/userApi';
import ResetSent from './ResetSent';
import { NOTFOUND_ROUTE } from '../../../../utils/consts';

const ResetSentGate = () => {
  const { search } = useLocation();
  const rst = new URLSearchParams(search).get('rst');
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!rst) { setAllowed(false); return; }
    let off = false;
    (async () => {
      try {
        const { data } = await resetSentGate(rst);
        if (!off) setAllowed(Boolean(data?.ok));
      } catch { if (!off) setAllowed(false); }
    })();
    return () => { off = true; };
  }, [rst]);

  if (allowed === null) return null;
  if (!allowed) return <Navigate to={NOTFOUND_ROUTE} replace />;
  return <ResetSent />;
};

export default ResetSentGate;
