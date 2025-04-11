import { useEffect, useState } from 'react'
import validator from 'validator';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import classes from './Login.module.css'
import FormInput from '../../../components/Auth/FormInput/FormInput';
import Brand from '../../../components/Auth/Brand/Brand';
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton';
import RecoveryButton from '../../../components/Auth/RecoveryButton/RecoveryButton';
import AuthSwitcher from '../../../components/Auth/AuthSwitcher/AuthSwitcher';
import FormInputPassword from '../../../components/Auth/FormInputPassword/FormInputPassword';
import FormErrorMessage from '../../../components/Auth/FormErrorMessage/FormErrorMessage';
import { useAuth } from '../../../components/Auth/AuthContext';
import Cookies from 'js-cookie';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();
  const { user, login } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/stories')
    }
  }, [user, navigate])

  useEffect(() => {
    setErrorMessage('')
  }, [email, password])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setErrorMessage('Пожалуйста заполните все поля!')
      return
    }

    if (!validator.isEmail(email)) { 
      setErrorMessage('Данные введены некорректно');
      return; 
    }

    if (password.length < 8) { 
      setErrorMessage('Данные введены некорректно');
      return; 
    }

    try {
      setIsLoading(true)
      const response = await axios.post('/api/login', {email, password})

      if (!response.data?.token || !response.data?.user) {
        setErrorMessage('Некорректный ответ от сервера');
        return;
      }

      Cookies.set('token', response.data.token, {
        expires: 365,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      })

      login(response.data.user)
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMessage('Данные введены некорректно');
        } else {
          setErrorMessage(error.response.data.message || 'Произошла ошибка на сервере');
        }
      } else {
        setErrorMessage('Произошла ошибка на клиенте');
      }
    }  finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className={classes.container}>
        <Brand />
        <form onSubmit={handleSubmit}>
          <FormInput 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type='email' 
          placeholder='Электронная почта' />
        <FormInputPassword
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='Пароль' />
          
          <RecoveryButton />

          {errorMessage && <div style={{ marginTop: '12px'}}><FormErrorMessage message={errorMessage}/></div>}

          <SubmitButton isLoading={isLoading}>Войти</SubmitButton>
        </form>
        <AuthSwitcher to={'/signup'}>Создать аккаунт</AuthSwitcher>
      </div>
    </>
  )
}

export default Login