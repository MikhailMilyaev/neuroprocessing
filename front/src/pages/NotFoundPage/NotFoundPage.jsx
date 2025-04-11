import AuthSwitcher from '../../components/Auth/AuthSwitcher/AuthSwitcher'
import Brand from '../../components/Auth/Brand/Brand'
import classes from './NotFoundPage.module.css'

const NotFoundPage = () => {
  return (
    <div className={classes.container}>
        <Brand />
        <p style={{ marginBottom: '30px'}}>Такой страницы не существует</p>
        <AuthSwitcher to={'/'}>На главную</AuthSwitcher>
    </div>
  )
}

export default NotFoundPage