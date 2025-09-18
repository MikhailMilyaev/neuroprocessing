import { Link } from 'react-router-dom';
import classes from './Education.module.css';
import BackBtn from '../../components/BackBtn/BackBtn';
import { PRACTICES } from '../../utils/practices';
import { EDUCATION_BASICS_PATH, practicePath } from '../../utils/consts';

export default function Education() {
  return (
    <div className={classes.index}>
      <BackBtn />
      
      <Link to={EDUCATION_BASICS_PATH} className={classes.cardLink}>
        <div className={classes.hero}>
          <h2 className={classes.heroTitle}>NEUROPROCESSING — основы</h2>
          <div className={classes.heroHint}>Открыть</div>
        </div>
      </Link>

      <h2 className={classes.sectionTitle}>Практики</h2>

      <div className={classes.grid}>
        {PRACTICES.map((p) => (
          <Link key={p.slug} to={practicePath(p.slug)} className={classes.cardLink}>
            <article className={classes.card}>
              <h3 className={classes.cardHead} title={p.title}>{p.title}</h3>
              <p className={classes.cardDesc} title={p.description}>{p.description}</p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
