import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import classes from './Education.module.css';
import BackBtn from '../../components/BackBtn/BackBtn';
import { ARTICLE_META } from './articles';

export default function Education() {
  // Мобилка: блокируем скролл документа (страница не скроллится)
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
      {/* Десктоп: кнопка «назад» */}
      <BackBtn className={classes.backDesktop} />

      {/* Моб: фиксированный заголовок */}
      <div className={classes.mHeader}>
        <h1>Обучение</h1>
      </div>

      {ARTICLE_META.map((art) => (
        <Link key={art.slug} to={`/education/${art.slug}`} className={classes.cardLink}>
          <div className={classes.hero}>
            <h2 className={classes.heroTitle}>{art.title}</h2>
            <div className={classes.heroHint}>Открыть</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
