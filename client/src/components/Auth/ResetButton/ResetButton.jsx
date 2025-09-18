import { Link } from 'react-router-dom';
import { IoKeyOutline } from 'react-icons/io5';
import classes from './ResetButton.module.css';

const ResetButton = () => {
  return (
    <div style={{ textAlign: 'left' }}>
      <Link to="/reset" className={classes.resetButton}>
        <IoKeyOutline className={classes.icon} aria-hidden="true" />
        Не помню пароль
      </Link>
    </div>
  );
};

export default ResetButton;
