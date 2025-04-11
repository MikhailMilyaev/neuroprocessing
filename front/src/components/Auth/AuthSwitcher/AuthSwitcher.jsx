import { Link } from "react-router-dom"
import classes from './AuthSwitcher.module.css'

const AuthSwitcher = ({ children, to }) => {
  return (
    <Link to={to} className={classes.authSwitcher}>{children}</Link>
  )
}

export default AuthSwitcher