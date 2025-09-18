import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Activated from './Activated';
import { activationLandingGate } from '../../../http/userApi';
import { NOTFOUND_ROUTE } from '../../../utils/consts';

// Рендерит Activated ТОЛЬКО если токен валиден
const ActivatedGate = () => {
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const lt = sp.get('lt');

  const [allowed, setAllowed] = useState(null); // null = ждём проверку

  useEffect(() => {
    let canceled = false;

    // если токена нет — мгновенно запрещаем
    if (!lt) { setAllowed(false); return; }

    (async () => {
      try {
        const { data } = await activationLandingGate(lt);
        if (!canceled) setAllowed(Boolean(data?.ok));
      } catch {
        if (!canceled) setAllowed(false);
      }
    })();

    return () => { canceled = true; };
  }, [lt]);

  if (allowed === null) return null; // ничего не рисуем во время проверки
  if (!allowed) return <Navigate to={NOTFOUND_ROUTE} replace />;

  return <Activated />;
};

export default ActivatedGate;
