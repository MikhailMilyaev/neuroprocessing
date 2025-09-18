import { Link } from 'react-router-dom';
import classes from './NotFound.module.css';

const NotFound = () => (
  <div className={classes.container}>
    <div className={classes.card}>
      <div className={classes.icon} aria-hidden>404</div>
      <h1 className={classes.title}>Страница не найдена</h1>
      <p className={classes.text}>Похоже, вы перешли по неверному адресу.</p>

      <div className={classes.actions}>
        <Link className={classes.btn} to="/">На главную</Link>
      </div>
    </div>
  </div>
);

export default NotFound;
