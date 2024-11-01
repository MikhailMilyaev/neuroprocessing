import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ErrorPage.module.css';

const ErrorPage = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.errorMessage}>Ошибка 404</h1>
      <p className={styles.errorText}>
        Кажется, вы пытаетесь зайти на несуществующую страницу.
      </p>
      <button className={styles.errorButton} onClick={() => navigate('/')}>
        Вернуться на главную
      </button>
    </div>
  );
};

export default ErrorPage;