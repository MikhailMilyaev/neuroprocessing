import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import classes from './Education.module.css';
import BackBtn from '../../components/BackBtn/BackBtn';
import { EDUCATION_BASICS_PATH, EDUCATION_THEORY_PATH } from '../../utils/consts';

export default function Education() {
  // Мобилка: блокируем скролл документа (страница не скроллится вовсе)
  useEffect(() => {
    if (!window.matchMedia('(max-width:700px)').matches) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div className={classes.index}>
      {/* Десктоп: кнопка «назад» (на мобилке скрыта через CSS) */}
      <BackBtn className={classes.backDesktop} />

      {/* Моб: фикс-хедер слева */}
      <div className={classes.mHeader}>
        <h1>Обучение</h1>
      </div>

      {/* Карточка «NEUROPROCESSING — основы» */}
      <Link to={EDUCATION_BASICS_PATH} className={classes.cardLink}>
        <div className={classes.hero}>
          <h2 className={classes.heroTitle}>NEUROPROCESSING — основы</h2>
          <div className={classes.heroHint}>Открыть</div>
        </div>
      </Link>
      <Link to={EDUCATION_THEORY_PATH} className={classes.cardLink}>
        <div className={classes.hero}>
          <h2 className={classes.heroTitle}>NEUROPROCESSING — подробная теория</h2>
          <div className={classes.heroHint}>Открыть</div>
        </div>
      </Link>
    </div>
  );
}
