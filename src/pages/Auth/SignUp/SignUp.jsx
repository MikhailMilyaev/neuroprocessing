import { useEffect, useState } from 'react'
import classes from './SignUp.module.css'
import Brand from '../../../components/Auth/Brand/Brand'
import FormInput from '../../../components/Auth/FormInput/FormInput'
import FormInputPassword from '../../../components/Auth/FormInputPassword/FormInputPassword'
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton'
import AuthSwitcher from '../../../components/Auth/AuthSwitcher/AuthSwitcher'
import validator from 'validator';
import FormErrorMessage from '../../../components/Auth/FormErrorMessage/FormErrorMessage'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../components/Auth/AuthContext'

const SignUp = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassoword, setConfirmPassoword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    setErrorMessage('')
  }, [name, email, password, confirmPassoword])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassoword) {
      setErrorMessage('Пожалуйста заполните все поля!')
      return
    }

    if (!validator.isEmail(email)) { 
      setErrorMessage('Электронная почта введена некорректно');
      return; 
    }

    if (password.length < 8) { 
      setErrorMessage('Длина пароля должна быть не менее 8 символов');
      return; 
    }

    if (password !== confirmPassoword) { 
      setErrorMessage('Пароли не совпадают');
      return; 
    }

    try {
      const response = await axios.post('/api/sign', {name, email, password})

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
      navigate('/stories')
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Произошла ошибка на сервере')
      } else {
        setErrorMessage('Произошла ошибка на клиенте');
      }
    }
  }

  return (
    <div className={classes.container}>
      <Brand />
      <form onSubmit={handleSubmit}>
        <FormInput 
          value={name}
          onChange={(e) => setName(e.target.value)}
          type={'text'}
          placeholder={'Имя'}/>
        <FormInput 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type={'email'}
          placeholder={'Электронная почта'}/>
        <FormInputPassword 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type={'password'}
          placeholder={'Пароль'}/>
        <div style={{ marginBottom: '30px'}}>
          <FormInputPassword 
            value={confirmPassoword}
            onChange={(e) => setConfirmPassoword(e.target.value)}
            type={'password'}
            placeholder={'Подтвердите пароль'}/>
        </div>

        {errorMessage && <div style={{marginTop: '-10px'}}><FormErrorMessage message={errorMessage}/></div>}

        <SubmitButton>Создать аккаунт</SubmitButton>
      </form>

      <AuthSwitcher to={'/login'}>Войти</AuthSwitcher>
    </div>
  )
}

export default SignUp