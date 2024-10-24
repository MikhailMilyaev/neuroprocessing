import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Lending from './Lending/Lending.jsx'
import LoginPage from './Lending/Auth/Login/LoginPage.jsx'
import CreatePage from './Lending/Auth/Create/CreatePage.jsx'
import RecoveryPage from './Lending/Auth/Login/RecoveryPage.jsx'


const App = () => {
  return (
  <Routes>
    <Route path='/' element={<Lending />} />
    <Route path='/login' element={<LoginPage />} />
    <Route path='/create' element={<CreatePage />} />
    <Route path='/recovery' element={<RecoveryPage />} />
  </Routes>
  )
}

export default App