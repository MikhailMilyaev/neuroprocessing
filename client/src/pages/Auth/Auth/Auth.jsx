import Brand from '../../../components/Auth/Brand/Brand'
import FormInput from '../../../components/Auth/FormInput/FormInput'
import Toast from '../../../components/Toast/Toast'
import AuthSwitcher from '../../../components/Auth/AuthSwitcher/AuthSwitcher'
import RecoveryButton from '../../../components/Auth/ResetButton/ResetButton'
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton'
import { useLocation, useNavigate } from 'react-router-dom'
import { LOGIN_ROUTE, REGISTRATION_ROUTE, STORIES_ROUTE, CHECKEMAIL_ROUTE } from '../../../utils/consts'
import { registration, login } from '../../../http/userApi'
import classes from './Auth.module.css'
import { useContext, useState, useEffect } from 'react'
import { validateLogin, validateRegistration } from '../../../components/Auth/authValidator'
import { Context }  from '../../../index'
import { observer } from 'mobx-react-lite'

const Auth = observer(() => {
  const { user } = useContext(Context)
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = location.pathname === LOGIN_ROUTE
  const isRegistration = location.pathname === REGISTRATION_ROUTE

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [wasSubmitted, setWasSubmitted] = useState(false)
  const [errorKey, setErrorKey] = useState(0)
  const [messageType, setMessageType] = useState('error')

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    if (isLogin && sp.get('verified') === '1') {
      setWasSubmitted(true)
      setMessageType('success')
      setErrorMessage('Почта подтверждена. Теперь войдите.')
      setErrorKey(prev => prev + 1)
    }
  }, [isLogin, location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setWasSubmitted(true)

    const error = isLogin
      ? validateLogin({ email, password })
      : validateRegistration({ name, email, password, confirmedPassword })

    if (error) {
      setErrorMessage(error)
      setMessageType('error')
      setErrorKey(prev => prev + 1)
      return
    }

    try {
      setIsLoading(true)

      if (isLogin) {
        await login(email, password, user)
        setMessageType('success')
        setErrorMessage('Успешный вход')
        setErrorKey(prev => prev + 1)
        setTimeout(() => navigate(STORIES_ROUTE), 1000)
      } else {
        try {
          await registration(name, email, password)
          sessionStorage.setItem('pendingEmail', email)
          navigate(CHECKEMAIL_ROUTE, { state: { email } })
        } catch (e) {
          const code = e?.response?.data?.code
          if (code === 'UNVERIFIED_EXISTS') {
            sessionStorage.setItem('pendingEmail', email)
            navigate(CHECKEMAIL_ROUTE, { state: { email } })
            return
          }
          throw e
        }
      }
    } catch (e) {
      setErrorMessage('Ошибка авторизации или регистрации')
      setMessageType('error')
      setErrorKey(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setWasSubmitted(false)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmedPassword('')
  }, [location.pathname])

  return (
    <div className={classes.container}>
      <Brand />

      {isLogin ? (
        <form>
          <FormInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type='email'
            placeholder='Электронная почта'
          />
          <FormInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type='password'
            placeholder='Пароль'
            containerStyle={{ marginBottom: 8 }}   // ← 8px до «Не помню пароль»
          />
          <RecoveryButton />
        </form>
      ) : (
        <form>
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            type='text'
            placeholder='Имя'
          />
          <FormInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type='email'
            placeholder='Электронная почта'
          />
          <FormInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type='password'
            placeholder='Пароль'
          />
          <FormInput
            value={confirmedPassword}
            onChange={(e) => setConfirmedPassword(e.target.value)}
            type='password'
            placeholder='Подтвердите пароль'
            containerStyle={{ marginBottom: 16 }}  
          />
        </form>
      )}

      <SubmitButton onSubmit={handleSubmit} isLoading={isLoading}>
        {isLogin ? 'Войти' : 'Создать аккаунт'}
      </SubmitButton>

      <AuthSwitcher to={isRegistration ? LOGIN_ROUTE : REGISTRATION_ROUTE}>
        {isRegistration ? 'Войти' : 'Создать аккаунт'}
      </AuthSwitcher>

      {wasSubmitted && errorMessage && (
        <Toast message={errorMessage} type={messageType} duration={3000} version={errorKey} placement="top"/>
      )}
    </div>
  )
})

export default Auth
