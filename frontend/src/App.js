import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Lending from './Lending/Lending.jsx';
import LoginPage from './Lending/Auth/Login/LoginPage.jsx';
import CreatePage from './Lending/Auth/Create/CreatePage.jsx';
import RecoveryPage from './Lending/Auth/Login/RecoveryPage.jsx';
import History from './Application/History/History.jsx';
import Ideas from './Application/Ideas/Ideas.jsx';
import Education from './Application/Education/Education.jsx';
import Community from './Application/Сommunity/Community.jsx';
import ErrorPage from './ErrorPage.jsx';
import Layout from './components/Layout/Layout.jsx';
import PrivateRoute from './Lending/Auth/PrivateRoute.jsx';
import PracticeList from './Application/Education/components/Content/Practices/PracticeList/PracticeList.jsx';
import Practice from './Application/Education/components/Content/Practices/Practice/Practice.jsx';
import IdeasAll from './Application/Ideas/components/IdeasAll/IdeasAll.jsx'
import IdeasThemes from './Application/Ideas/components/IdeasThemes/IdeasThemes.jsx'
import IdeasSaved from './Application/Ideas/components/IdeasSaved/IdeasSaved.jsx'
import IdeasInProgress from './Application/Ideas/components/IdeasInProgress/IdeasInProgress.jsx'
import ArticleList from './Application/Education/components/Content/Articles/ArticleList.jsx';
import VideoList from './Application/Education/components/Content/Videos/VideoList.jsx';
import DictionaryList from './Application/Education/components/Content/Dictionary/DictionaryList.jsx';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Lending />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/recovery" element={<RecoveryPage />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="history" element={<History />} />
        <Route path="ideas" element={<Ideas />}>
          <Route path="all" element={<IdeasAll />} />
          <Route path="themes" element={<IdeasThemes />} />
          <Route path="saved" element={<IdeasSaved />} />
          <Route index element={<Navigate to="all" replace />} />
        </Route>
        <Route path="ideas/inprogress" element={<IdeasInProgress />} />
        <Route path="community" element={<Community />} />
        <Route path="education" element={<Education />}>
          <Route path="practices" element={<PracticeList />} />
          <Route path="articles" element={<ArticleList />} /> 
          <Route path="videos" element={<VideoList />} />
          <Route path="dictionary" element={<DictionaryList />} /> 
          <Route index element={<Navigate to="practices" replace />} />
        </Route>
      </Route>
      <Route path="/education/practices/:practiceSlug" element={<Practice />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};

export default App;