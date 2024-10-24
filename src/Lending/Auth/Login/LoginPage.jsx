import React, { useState } from 'react';
import classes from './LoginPage.module.css';
import { Link } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import validator from 'validator';
// import axios from 'axios'

// писать функционал для авторизованных и неавторизованных пользователей
// создать почту для отправки сообщения
// где

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('')

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

// отправка данных на сервер

  }


  return (
    <div className={classes.backImage}>
      <div className={classes.inputContainer}>
        <Link to="/" className={classes.brandName}>NEUROPROCESSING</Link>

        <div className={classes.emailInput}>
          <input
            value={email}
            type="text"
            placeholder="Электронная почта"
            onChange={handleMailChange}
            className={classes.inputField} />
          {email ? (<span className={classes.clearIcon} onClick={handleMailClear}>×</span>) : null}
        </div>

        <div className={classes.passwordInput}>
          <input
            value={password}
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            onChange={handlePasswordChange}
            className={classes.inputField} />
          {password ? (<span className={classes.showPasswordIcon}onClick={togglePasswordVisibility}>
            {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />} </span>) : null}
        </div>

        <Link to='/recovery' className={classes.recovery} style={{ marginBottom: errorMessage ? '10px' : '20px' }}>Не помню пароль</Link>
        {errorMessage && <div className={classes.errorMessage}>{errorMessage}</div>} 
        <button onClick={handleSubmit} className={classes.enter}>Войти</button>
        <Link to="/create" className={classes.createAccount}>Создать аккаунт</Link>
      </div>
    </div>
  );
};

export default LoginPage;