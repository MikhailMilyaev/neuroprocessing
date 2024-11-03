import React from 'react';
import { Routes, Route} from 'react-router-dom';
import Lending from './Lending/Lending.jsx';
import LoginPage from './Lending/Auth/Login/LoginPage.jsx';
import CreatePage from './Lending/Auth/Create/CreatePage.jsx';
import RecoveryPage from './Lending/Auth/Login/RecoveryPage.jsx';
import History from './Application/History/History.jsx';
import Ideas from './Application/Ideas/Ideas.jsx'
import Education from './Application/Education/Education.jsx'
import Community from './Application/Сommunity/Community.jsx'
import ErrorPage from './ErrorPage.jsx';
import Layout from './components/Layout/Layout.jsx';
import PrivateRoute from './Lending/Auth/PrivateRoute.jsx';
import Article from './Application/Education/components/Articles/Article/Article.jsx'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Lending />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/create" element={ <CreatePage />} />
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path='/' element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="history" element={<History />} />
        <Route path="ideas" element={<Ideas />} />
        <Route path="education" element={<Education />} />
        <Route path="community" element={<Community />} />
      </Route>
      <Route path="education/:category/:title" element={<PrivateRoute><Article /></PrivateRoute>} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};
export default App;