// src/routes.js (или где у тебя объявлены массивы роутов)

import { Navigate } from 'react-router-dom';

import Landing from './pages/Landing/Landing';
import Auth from './pages/Auth/Auth/Auth';
import CheckEmailGate from './pages/Auth/CheckEmail/CheckEmailGate';
import ActivatedGate from './pages/Auth/Activated/ActivatedGate';

import Stories from './pages/Stories/Stories';
import Story from './pages/Story/Story';
import Ideas from './pages/Ideas/Ideas';

import SettingsMobile from './pages/SettingsMobile';

import AdminUsers from './pages/Admin/AdminUsers';
import RequireAdmin from './utils/RequireAdmin';
import RequireAuth from './utils/RequireAuth';
import PublicOnly from './utils/PublicOnly';

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
  EDUCATION_BASICS_PATH, PRACTICE_BASE, EDUCATION_THEORY_PATH, ADMIN_ROUTE,
  RESET_SENT_ROUTE, RESET_PASSWORD_ROUTE, RESET_SUCCESS_ROUTE
} from './utils/consts';

// ===== Приватные роуты (только для авторизованных) =====
export const authRoutes = [
  { path: STORIES_ROUTE, element: (<RequireAuth><Stories /></RequireAuth>) },
  { path: STORY_ROUTE + '/:slug', element: (<RequireAuth><Story /></RequireAuth>) },
  { path: IDEAS_ROUTE, element: (<RequireAuth><Ideas /></RequireAuth>) },

  { path: EDUCATION_ROUTE, element: (<RequireAuth><Education /></RequireAuth>) },
  { path: EDUCATION_BASICS_PATH, element: (<RequireAuth><Basics /></RequireAuth>) },
  { path: EDUCATION_THEORY_PATH, element: (<RequireAuth><Advanced /></RequireAuth>) },

  { path: SETTINGS_ROUTE, element: (<RequireAuth><SettingsMobile /></RequireAuth>) },

  // { path: PRACTICE_BASE + '/:slug', element: (<RequireAuth><Practice /></RequireAuth>) },
  { path: PRACTICE_BASE + '/:slug', element: (<RequireAuth><Navigate to={EDUCATION_ROUTE} replace /></RequireAuth>) },

  // Админка (только роль ADMIN)
  { path: ADMIN_ROUTE, element: (<RequireAdmin><AdminUsers /></RequireAdmin>) },
];

// ===== Публичные роуты (не пускать, если уже авторизован) =====
export const publicRoutes = [
  { path: LANDING_ROUTE, element: (<PublicOnly><Landing /></PublicOnly>) },
  { path: LOGIN_ROUTE, element: (<PublicOnly><Auth /></PublicOnly>) },
  { path: REGISTRATION_ROUTE, element: (<PublicOnly><Auth /></PublicOnly>) },

  { path: RESET_ROUTE, element: (<PublicOnly><Reset /></PublicOnly>) },
  { path: RESET_SENT_ROUTE, element: (<PublicOnly><ResetSentGate /></PublicOnly>) },
  { path: RESET_PASSWORD_ROUTE, element: (<PublicOnly><ResetPasswordGate /></PublicOnly>) },
  { path: RESET_SUCCESS_ROUTE, element: (<PublicOnly><ResetSuccessGate /></PublicOnly>) },

  { path: CHECKEMAIL_ROUTE, element: (<PublicOnly><CheckEmailGate /></PublicOnly>) },
  { path: ACTIVATED_ROUTE, element: (<PublicOnly><ActivatedGate /></PublicOnly>) },

  { path: NOTFOUND_ROUTE, element: <NotFound /> },
  { path: '*', element: <NotFound /> },
];
