import { useNavigate } from 'react-router-dom';
import SubmitButton from '../../../../components/Auth/SubmitButton/SubmitButton';
import { LOGIN_ROUTE } from '../../../../utils/consts';
import classes from '../ResetCommon.module.css';

const ResetSuccess = () => {
  const navigate = useNavigate();
  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <div className={classes.icon} aria-hidden>✓</div>
        <h1 className={classes.title}>Ваш пароль изменён.</h1>
        <SubmitButton onSubmit={() => navigate(LOGIN_ROUTE)} isLoading={false}>
          Войти
        </SubmitButton>
      </div>
    </div>
  );
};

export default ResetSuccess;
