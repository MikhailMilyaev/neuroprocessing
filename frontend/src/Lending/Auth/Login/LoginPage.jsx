import React, { useState, useContext } from 'react';
import classes from './LoginPage.module.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import validator from 'validator';
import { AuthContext } from '../AuthContext';

// import axios from 'axios'

// создать почту для восстановления пароля

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const clearError = () => {
    setErrorMessage('');
  };

  const handleMailChange = (e) => {
    setEmail(e.target.value);
    clearError();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    clearError();
  };

  const handleMailClear = () => {
    setEmail('');  
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    if (!email || !password) {
      setErrorMessage('Пожалуйста, заполните все поля!');
      return;
    }

    if (!validator.isEmail(email)) { 
      setErrorMessage('Данные введены некорректно');
      return; 
    }

    if (password.length <= 8) { 
      setErrorMessage('Данные введены некорректно');
      return; 
    }

    setTimeout(() => { 
      if (email === 'test@mail.ru' && password === 'password123') {
        login();
        navigate('/history');
      } else {
        setErrorMessage('Неверный логин или пароль');
      }
    }, 500); 
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e); 
    }
  };

  return (
    <body className={location.pathname === '/login' ? '' : 'overflow-hidden'}>
    <div className={classes.backImage}>
      <div className={classes.inputContainer} onKeyDown={handleKeyDown} tabIndex={0}>
        <Link to="/" className={classes.brandName}>NEUROPROCESSING</Link> 
        <div className={classes.emailInput}>
          <input
            value={email}
            type="text"
            placeholder="Электронная почта"
            onChange={handleMailChange}
            className={classes.inputField}/>
          {email ? (<span className={classes.clearIcon} onClick={handleMailClear}>×</span>) : null}
        </div>

        <div className={classes.passwordInput}>
          <input
            value={password}
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            onChange={handlePasswordChange}
            className={classes.inputField}/>
          {password ? (
            <span className={classes.showPasswordIcon} onClick={togglePasswordVisibility}>
              {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
            </span>
          ) : null}
        </div>
        <Link to="/recovery" className={classes.recovery} style={{ marginBottom: errorMessage ? '10px' : '20px' }}>Не помню пароль</Link>

        {errorMessage && <div className={classes.errorMessage}>{errorMessage}</div>}

        <button onClick={handleSubmit}  className={classes.enter} > Войти</button> 

        <Link to="/create"  className={classes.createAccount} > Создать аккаунт</Link> 
      </div> 
    </div> </body>
  ); 
};

export default LoginPage;