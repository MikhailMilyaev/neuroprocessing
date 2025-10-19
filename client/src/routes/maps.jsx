import Landing from '../pages/Landing/Landing';
import Auth from '../pages/Auth/Auth/Auth';
import CheckEmailGate from '../pages/Auth/CheckEmail/CheckEmailGate';
import ActivatedGate from '../pages/Auth/Activated/ActivatedGate';

import Stories from '../pages/Stories/Stories';
import Story from '../pages/Story/Story';
import IdeaDrafts from '../pages/IdeaDrafts/IdeaDrafts';

import SettingsMobile from '../pages/SettingsMobile';

import AdminUsers from '../pages/Admin/AdminUsers';  

import EducationIndex from '../pages/Education/Education';
import EducationArticle from '../pages/Education/Article/EducationArticle';

import Practices from '../pages/Practices/Practices';
import PracticeRun from '../pages/Practices/PracticeRun';

import NotFound from '../pages/NotFound/NotFound';

import Reset from '../pages/Auth/Reset/Reset';
import ResetSentGate from '../pages/Auth/Reset/ResetSent/ResetSentGate';
import ResetPasswordGate from '../pages/Auth/Reset/ResetPassword/ResetPasswordGate';
import ResetSuccessGate from '../pages/Auth/Reset/ResetSuccess/ResetSuccessGate';

import {
  LANDING_ROUTE, LOGIN_ROUTE, REGISTRATION_ROUTE, CHECKEMAIL_ROUTE, ACTIVATED_ROUTE,
  RESET_ROUTE, RESET_SENT_ROUTE, RESET_PASSWORD_ROUTE, RESET_SUCCESS_ROUTE,
  STORIES_ROUTE, STORY_ROUTE, IDEA_DRAFTS_ROUTE,
  EDUCATION_ROUTE, SETTINGS_ROUTE, NOTFOUND_ROUTE,
  PRACTICES_ROUTE, PRACTICE_RUN_ROUTE,
} from '../utils/consts';

export const authRoutes = [
  { path: STORIES_ROUTE, element: <Stories /> },
  { path: `${STORY_ROUTE}/:slug`, element: <Story /> },
  { path: IDEA_DRAFTS_ROUTE, element: <IdeaDrafts /> },

  { path: PRACTICES_ROUTE, element: <Practices /> },
  { path: PRACTICE_RUN_ROUTE, element: <PracticeRun /> },

  { path: EDUCATION_ROUTE, element: <EducationIndex /> },
  { path: `${EDUCATION_ROUTE}/:slug`, element: <EducationArticle /> },

  { path: SETTINGS_ROUTE, element: <SettingsMobile /> },
];

export const publicRoutes = [
  { path: LANDING_ROUTE, element: <Landing /> },
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

export { AdminUsers }; 
