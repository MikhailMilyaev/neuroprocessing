import Landing from '../pages/Landing/Landing';
import Auth from '../pages/Auth/Auth/Auth';
import CheckEmailGate from '../pages/Auth/CheckEmail/CheckEmailGate';
import ActivatedGate from '../pages/Auth/Activated/ActivatedGate';

import Stories from '../pages/Stories/Stories';
import Story from '../pages/Story/Story';
import IdeaDrafts from '../pages/IdeaDrafts/IdeaDrafts';

import Practices from '../pages/Practices/Practices';
import Practice from '../pages/Practice/Practice';

import Education from '../pages/Educaiton/Education';

import NotFound from '../pages/NotFound/NotFound';

import Reset from '../pages/Auth/Reset/Reset';
import ResetSentGate from '../pages/Auth/Reset/ResetSent/ResetSentGate';
import ResetPasswordGate from '../pages/Auth/Reset/ResetPassword/ResetPasswordGate';
import ResetSuccessGate from '../pages/Auth/Reset/ResetSuccess/ResetSuccessGate';

import {
  LANDING_ROUTE, LOGIN_ROUTE, REGISTRATION_ROUTE, CHECKEMAIL_ROUTE, ACTIVATED_ROUTE,
  RESET_ROUTE, RESET_SENT_ROUTE, RESET_PASSWORD_ROUTE, RESET_SUCCESS_ROUTE,
  STORIES_ROUTE, STORY_ROUTE, IDEA_DRAFTS_ROUTE, NOTFOUND_ROUTE,
  PRACTICES_ROUTE, PRACTICE_ROUTE, EDUCATION_ROUTE
} from '../utils/consts';

export const authRoutes = [
  { path: STORIES_ROUTE, element: <Stories /> },
  { path: `${STORY_ROUTE}/:slug`, element: <Story /> },
  { path: IDEA_DRAFTS_ROUTE, element: <IdeaDrafts /> },

  { path: PRACTICES_ROUTE, element: <Practices /> },
  { path: PRACTICE_ROUTE, element: <Practice /> },

  { path: EDUCATION_ROUTE, element: <Education /> },
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