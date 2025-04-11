import classes from './ResetPassword.module.css'
import Brand from '../../../components/Auth/Brand/Brand'
import FormInputPassword from '../../../components/Auth/FormInputPassword/FormInputPassword'
import { useEffect, useState } from 'react'
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton'
import FormErrorMessage from '../../../components/Auth/FormErrorMessage/FormErrorMessage'
import axios from 'axios'
import AuthSwitcher from '../../../components/Auth/AuthSwitcher/AuthSwitcher'
import { useLocation, useNavigate } from 'react-router-dom'

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('')
  const [newConfirmPassword, setNewConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(location.search)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
        navigate('/login')
    }
  }, [navigate, token])

  useEffect(() => {
    setErrorMessage('')
  }, [newPassword, newConfirmPassword])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newPassword || !newConfirmPassword) {
        setErrorMessage('Пожалуйста заполните все поля!')
        return
    }

    if (newPassword.length < 8) {
        setErrorMessage('Длина пароля должна быть не менее 8 символов');
        return; 
    }

    if (newPassword !== newConfirmPassword) {
        setErrorMessage('Пароли не совпадают');
        return; 
    }

    try {
      setIsLoading(true)
      await axios.post('/api/reset', {newPassword, token})
      setSuccess(true)
    } catch (error) {
        if (error.response) {
          if (error.response.status === 400) {
            setErrorMessage('Ссылка для сброса устарела или некорректна.')
          } else {
            setErrorMessage(error.response.data.message || 'Ошибка на сервере')
          }
        } else {
          setErrorMessage('Ошибка при соединении с сервером')
        }
    } finally {
        setIsLoading(false)
      }
  }

  return (
    <div className={classes.container}>
        <Brand />

        {!success ? 
            <form onSubmit={handleSubmit}>
                <FormInputPassword 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={'password'}
                    placeholder={'Новый пароль'}/>
            <div style={{ marginBottom: '30px'}}>
                <FormInputPassword 
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    type={'password'}
                    placeholder={'Подтвердите новый пароль'}/>
            </div>
            
            {errorMessage && <FormErrorMessage message={errorMessage}/>}

            <SubmitButton isLoading={isLoading}>Подтвердить</SubmitButton> 
            </form> :  
            <>
                <p style={{ marginBottom: '30px'}}>Ваш пароль изменён</p>
                <AuthSwitcher to={'/login'}>Войти</AuthSwitcher>
            </>
        }
    </div>
  )
}

export default ResetPassword