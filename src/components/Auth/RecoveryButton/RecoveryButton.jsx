import { Link } from 'react-router-dom'
import classes from './RecoveryButton.module.css'

const RecoveryButton = () => {
  return (
    <div style={{ textAlign: 'left'}}>
      <Link to='/recovery' className={classes.recoveryButton}>Не помню пароль</Link>
    </div>

    
  )
}

export default RecoveryButton