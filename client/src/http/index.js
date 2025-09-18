import axios from 'axios'
import { Context } from '../index'

const $host = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

const $authHost = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

const authInterceptor = config => {
  config.headers.authorization = `Bearer ${localStorage.getItem('token')}`
  return config
}
$authHost.interceptors.request.use(authInterceptor)

$authHost.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        const ctx = Context._currentValue;
        if (ctx?.user) ctx.user.logout();
      } catch {}
    }
    return Promise.reject(error);
  }
)

export { $host, $authHost }
