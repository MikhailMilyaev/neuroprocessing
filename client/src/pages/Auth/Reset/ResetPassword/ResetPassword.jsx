import Brand from '../../../../components/Auth/Brand/Brand';
import FormInputPassword from '../../../../components/Auth/FormInput/FormInput';
import SubmitButton from '../../../../components/Auth/SubmitButton/SubmitButton';
import Toast from '../../../../components/Toast/Toast';
import classes from './ResetPassword.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { resetPasswordConfirm } from '../../../../http/userApi';
import { RESET_SUCCESS_ROUTE } from '../../../../utils/consts';

const ResetPassword = () => {
  const { search } = useLocation();
  const pr = new URLSearchParams(search).get('pr');

  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  const [errKey, setErrKey] = useState(0); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showErr = (msg) => {
    setErr(msg);
    setErrKey((k) => k + 1); 
  };

  useEffect(() => { setErr(''); }, [p1, p2]);

  const submit = async (e) => {
    e.preventDefault();
    if (!p1 || !p2) return showErr('Заполните все поля.');
    if (p1.length < 8) return showErr('Длина пароля должна быть не менее 8 символов.');
    if (p1 !== p2) return showErr('Пароли не совпадают.');

    try {
      setLoading(true);
      const { data } = await resetPasswordConfirm({ pr, newPassword: p1 });
      navigate(`${RESET_SUCCESS_ROUTE}?ps=${encodeURIComponent(data.ps)}`);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Ошибка на сервере';
      showErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <Brand />

      <form onSubmit={submit}>
        <FormInputPassword
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          placeholder="Новый пароль"
          type="password"
        />

        <FormInputPassword
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          placeholder="Подтвердите новый пароль"
          type="password"
          containerStyle={{ marginBottom: 16 }}
        />

        <SubmitButton isLoading={loading}>Подтвердить</SubmitButton>
      </form>

      {err && (
        <Toast
          message={err}
          type="error"
          duration={3000}
          version={errKey}
          placement="top"
          onClose={() => setErr('')}
        />
      )}
    </div>
  );
};

export default ResetPassword;
