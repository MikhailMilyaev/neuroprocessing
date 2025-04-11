import { useEffect, useState } from 'react'
import Brand from '../../../components/Auth/Brand/Brand'
import FormInput from '../../../components/Auth/FormInput/FormInput'
import classes from './Recovery.module.css'
import SubmitButton from '../../../components/Auth/SubmitButton/SubmitButton'
import AuthSwitcher from '../../../components/Auth/AuthSwitcher/AuthSwitcher'
import validator from 'validator'
import axios from 'axios'
import FormErrorMessage from '../../../components/Auth/FormErrorMessage/FormErrorMessage'

const Recovery = () => {
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setErrorMessage('')
  }, [email])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setErrorMessage('Пожалуйта, заполните поле!')
      return
    }

    if (!validator.isEmail(email)) {
      setErrorMessage('Данные введены некорректно');
      return
    }

    try {
      await axios.post('/api/recovery', {email})
      setSuccess(true)
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          setErrorMessage('Данные введены некорректно');
        } else {
          setErrorMessage(error.response.data.message || 'Произошла ошибка на сервере');
        }
      } else {
        setErrorMessage('Произошла ошибка на клиенте');
      }
    }
  }

  return (
    <div className={classes.container}>
      <Brand />
      {!success ?
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px'}}>
            <FormInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type={'email'}
              placeholder={'Электронная почта'} />
          </div>
          {errorMessage && <FormErrorMessage message={errorMessage}/> }

          <SubmitButton>Отправить</SubmitButton>  
        </form>
         : <p style={{ marginBottom: '30px'}}>На ваш адрес было отправлено письмо с восстановлением пароля</p>
      }

        <AuthSwitcher to={'/login'}>Войти</AuthSwitcher>
    </div>
  )
}

export default Recovery