import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"

const ProtectedRoute = ({ children }) => {
  const { user, login } = useAuth()

  useEffect(() => {
    const token = Cookies.get('token')
    if (token && !user) {
      axios.get('api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((response) => {
        login(response.data.user)
      })
      .catch(() => {
        Cookies.remove('token');
      })
    }
  }, [user, login])

  if (!user) {
    return <Navigate to='/login' replace/>
  }

  return children
}

export default ProtectedRoute