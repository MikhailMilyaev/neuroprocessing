import { lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import classes from './Education.module.css';
import BackBtn from '../../components/BackBtn/BackBtn';
import Spinner from '../../components/Spinner/Spinner';
import { practiceMap } from '../../utils/practices';

/** ===== Настройка задержки =====
 * Поставь нужное время в миллисекундах.
 * Поставь 0, когда надо отключить.
 */
const DELAY_MS = 5000;

/** Обёртка вокруг React.lazy с искусственной задержкой */
const lazyWithDelay = (factory, delay = DELAY_MS) =>
  lazy(() =>
    Promise.all([
      factory(),
      delay > 0 ? new Promise((res) => setTimeout(res, delay)) : Promise.resolve(),
    ]).then(([mod]) => mod)
  );

const loaders = {
  'good-bad': lazyWithDelay(() => import('./articles/GoodBad/GoodBad')),
  'self-destructive': lazyWithDelay(() => import('./articles/SelfDestructive/SelfDestructive')),
};

export default function Practice() {
  const { slug } = useParams();

  const meta = practiceMap.get(slug);
  const Article = loaders[slug];

  if (!meta || !Article) {
    return (
      <div className={classes.index}>
        <BackBtn />
        <h2 style={{ marginTop: 24, marginBottom: 16 }}>Материал не найден</h2>
        <Link to="/education" className={classes.btnDark}>К списку</Link>
      </div>
    );
  }

  return (
    <>
      <BackBtn />
      <Suspense
        fallback={
          <div className={classes.loader}>
            <Spinner size={18} />
          </div>
        }
      >
        <Article />
      </Suspense>
    </>
  );
}
