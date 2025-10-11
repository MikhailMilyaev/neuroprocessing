import Landing from './pages/Landing/Landing';
import Auth from './pages/Auth/Auth/Auth';
import CheckEmailGate from './pages/Auth/CheckEmail/CheckEmailGate';
import ActivatedGate from './pages/Auth/Activated/ActivatedGate';
import Stories from './pages/Stories/Stories';
import Story from './pages/Story/Story';
import Ideas from './pages/Ideas/Ideas';
import { Navigate } from 'react-router-dom';
import SettingsMobile from './pages/SettingsMobile';

import Education from './pages/Education/Education';
import Basics from './pages/Education/articles/Basics/Basics';
import Advanced from './pages/Education/articles/Advanced/Advanced';
// import Practice from './pages/Education/Practice';

import NotFound from './pages/NotFound/NotFound';

import Reset from './pages/Auth/Reset/Reset';

import ResetSentGate from './pages/Auth/Reset/ResetSent/ResetSentGate';
import ResetPasswordGate from './pages/Auth/Reset/ResetPassword/ResetPasswordGate';
import ResetSuccessGate from './pages/Auth/Reset/ResetSuccess/ResetSuccessGate';

import {
  LANDING_ROUTE, LOGIN_ROUTE, REGISTRATION_ROUTE, CHECKEMAIL_ROUTE, ACTIVATED_ROUTE, RESET_ROUTE,
  STORIES_ROUTE, STORY_ROUTE, EDUCATION_ROUTE, NOTFOUND_ROUTE, IDEAS_ROUTE, SETTINGS_ROUTE,
  EDUCATION_BASICS_PATH, PRACTICE_BASE, EDUCATION_THEORY_PATH,
  RESET_SENT_ROUTE, RESET_PASSWORD_ROUTE, RESET_SUCCESS_ROUTE
} from './utils/consts';

export const authRoutes = [
  { path: STORIES_ROUTE, element: <Stories /> },
  { path: STORY_ROUTE + '/:slug', element: <Story /> },
  { path: IDEAS_ROUTE, element: <Ideas /> },

  { path: EDUCATION_ROUTE, element: <Education /> },
  { path: EDUCATION_BASICS_PATH, element: <Basics /> },
  { path: EDUCATION_THEORY_PATH, element: <Advanced /> },
  { path: SETTINGS_ROUTE, element: <SettingsMobile /> },
  // { path: PRACTICE_BASE + '/:slug', element: <Practice /> },
  { path: PRACTICE_BASE + '/:slug', element: <Navigate to={EDUCATION_ROUTE} replace /> }
];

export const publicRoutes = [
  { path: LANDING_ROUTE, element: <Landing/> },
  { path: LOGIN_ROUTE, element: <Auth /> },
  { path: REGISTRATION_ROUTE, element: <Auth /> },

  { path: RESET_ROUTE, element: <Reset /> },
  { path: RESET_SENT_ROUTE, element: <ResetSentGate /> },
  { path: RESET_PASSWORD_ROUTE, element: <ResetPasswordGate /> },
  { path: RESET_SUCCESS_ROUTE, element: <ResetSuccessGate /> },

  { path: CHECKEMAIL_ROUTE, element: <CheckEmailGate /> },
  { path: ACTIVATED_ROUTE, element: <ActivatedGate /> },

  { path: NOTFOUND_ROUTE, element: <NotFound /> },
  { path: '*', element: <NotFound /> },
];
