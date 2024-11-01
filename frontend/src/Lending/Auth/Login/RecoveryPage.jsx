import React, { useState } from 'react';
import classes from './RecoveryPage.module.css';
import { Link, useLocation } from 'react-router-dom';
import { FaArrowLeftLong } from "react-icons/fa6";

const RecoveryPage = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('')
  const location = useLocation();

  const handleMailChange = (e) => {
    setEmail(e.target.value);
    clearError()
  };

  const handleMailClear = () => {
    setEmail('');  
  };

  const clearError = () => {
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setErrorMessage('Пожалуйста, введите электронную почту')
    }
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
        <div className={classes.header}>
          <Link to='/login' className={classes.backArrow}><FaArrowLeftLong /></Link>
          <Link to='/' className={classes.brandName}>NEUROPROCESSING</Link>
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

          {errorMessage && <div className={classes.errorMessage}>{errorMessage}</div>} 

        <button onClick={handleSubmit} className={classes.sent} style={{ marginTop: errorMessage ? '12.5px' : '20px' }}>Отправить</button>
      </div>
    </div></body>
  );
};

export default RecoveryPage;