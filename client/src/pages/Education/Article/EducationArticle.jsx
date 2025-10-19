import { lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import BackBtn from '../../../components/BackBtn/BackBtn';
import Spinner from '../../../components/Spinner/Spinner';
import { ARTICLE_LOADERS, ARTICLE_META } from '../articles';
import classes from '../Education.module.css';

export default function EducationArticle() {
  const { slug } = useParams();

  const meta = ARTICLE_META.find((m) => m.slug === slug);
  const Article = ARTICLE_LOADERS[slug];

  if (!meta || !Article) {
    return (
      <div className={classes.index}>
        <BackBtn />
        <h2 style={{ marginTop: 24, marginBottom: 16 }}>Материал не найден</h2>
        <Link to="/education" className={classes.heroHint}>К списку</Link>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div style={{ marginTop: 60, textAlign: 'center' }}>
        <Spinner size={24} />
      </div>
    }>
      <Article />
    </Suspense>
  );
}
