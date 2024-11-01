import React, { useState } from 'react';
import classes from './CreatePage.module.css';
import { Link, useLocation } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import validator from 'validator';
// import axios from 'axios'

const CreatePage = () => {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [showConfimedPassword, setShowConfimedPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('')
  const location = useLocation();

  const handleUserNameChange = (e) => {
    setUserName(e.target.value)
    clearError()
  }

  const handleMailChange = (e) => {
    setEmail(e.target.value);
    clearError();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    clearError();
  };

  const handleConfirmedPasswordChange = (e) => {
    setConfirmedPassword(e.target.value)
    clearError()
  }

  const handleUserNameClear = () => {
    setUserName('');  
  };

  const handleMailClear = () => {
    setEmail('');  
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfimedPasswordVisibility = () => {
    setShowConfimedPassword(!showConfimedPassword)
  }

  const clearError = () => {
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userName || !email || !password || !confirmedPassword) {
      setErrorMessage('Пожалуйста, заполните все поля')
    } else if (!validator.isEmail(email)) { 
      setErrorMessage('Электронная почта введена некорректно');
      return; 
    } else if (password.length <= 8) { 
      setErrorMessage('Длина пароля должна быть не менее 8 символом');
      return; 
    } else if (password !== confirmedPassword) {
      setErrorMessage('Пароли не совпадают')
      return
    }

    // отправка данных на сервер
  }

  const handleKeyDown =  (e)  =>  {  
    if (e.key  ===  'Enter')  {  
      handleSubmit(e);
    }  
   };  

  return (
    <body className={location.pathname === '/create' ? '' : 'overflow-hidden'}>
    <div className={classes.backImage}>
      <div className={classes.inputContainer} onKeyDown={handleKeyDown} tabIndex={0}>
        <Link to="/" className={classes.brandName}>NEUROPROCESSING</Link>

        <div className={classes.emailInput}>
          <input
            value={userName}
            type="text"
            placeholder="Имя"
            onChange={handleUserNameChange}
            className={classes.inputField} />
          {userName ? (<span className={classes.clearIcon} onClick={handleUserNameClear}>×</span>) : null}
        </div>

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
          {password ? (<span className={classes.showPasswordIcon} onClick={togglePasswordVisibility}>
            {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />} </span>) : null}
        </div>

        <div className={classes.passwordInput}>
          <input
            value={confirmedPassword}
            type={showConfimedPassword ? 'text' : 'password'}
            placeholder="Подтвердите пароль"
            onChange={handleConfirmedPasswordChange}
            className={classes.inputField} />
          {confirmedPassword ? (<span className={classes.showPasswordIcon} onClick={toggleConfimedPasswordVisibility}>
            {showConfimedPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />} </span>) : null}
        </div>

        {errorMessage && <div className={classes.errorMessage}>{errorMessage}</div>} 

        <button onClick={handleSubmit} className={classes.createAccount} style={{ marginTop: errorMessage ? '15px' : '30px' }}>Создать аккаунт</button>
        
        <Link to="/login" className={classes.enter}>Войти</Link>
      </div>
    </div></body>
  );
};

export default CreatePage;