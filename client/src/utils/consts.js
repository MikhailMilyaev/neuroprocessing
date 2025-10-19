export const LANDING_ROUTE = '/';
export const LOGIN_ROUTE = '/login';
export const REGISTRATION_ROUTE = '/registration';
export const CHECKEMAIL_ROUTE = '/check-email';
export const ACTIVATED_ROUTE = '/account-activated';
export const SETTINGS_ROUTE = '/settings';
export const ADMIN_ROUTE = '/admin';

export const RESET_ROUTE = '/reset';
export const RESET_SENT_ROUTE = '/reset-sent';
export const RESET_PASSWORD_ROUTE = '/reset-password';
export const RESET_SUCCESS_ROUTE = '/reset-success';

export const STORIES_ROUTE = '/stories';
export const STORY_ROUTE = '/story';
export const IDEA_DRAFTS_ROUTE = '/idea-drafts';

export const EDUCATION_ROUTE = '/education';  
export const educationPath = (slug) => `${EDUCATION_ROUTE}/${slug}`; 

export const EDUCATION_SLUGS = {
  BASICS: 'basics',
  ADVANCED: 'advanced',
  GOOD_BAD: 'good-bad',
};

export const PRACTICES_ROUTE = '/practices';
export const PRACTICE_RUN_ROUTE = `${PRACTICES_ROUTE}/:practiceSlug/:ideaSlug`;

export const practicePath = (slug) => `${EDUCATION_ROUTE}/${slug}`;

export const NOTFOUND_ROUTE = '/404';
