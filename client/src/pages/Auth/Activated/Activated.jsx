import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton';
import { LOGIN_ROUTE } from '../../../utils/consts';
import classes from './Activated.module.css';

const Activated = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try { sessionStorage.removeItem('pendingEmail'); } catch {}
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <div className={classes.icon} aria-hidden>✓</div>
        <h1 className={classes.title}>Аккаунт активирован!</h1>

        <SubmitButton onSubmit={() => navigate(LOGIN_ROUTE)} isLoading={false}>
          Войти
        </SubmitButton>
      </div>
    </div>
  );
};

export default Activated;
