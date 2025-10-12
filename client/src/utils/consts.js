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
export const IDEAS_ROUTE = '/ideas';
export const EDUCATION_ROUTE = '/education';

export const NOTFOUND_ROUTE = '/404';

export const EDUCATION_BASICS_PATH = `${EDUCATION_ROUTE}/basics`;
export const EDUCATION_THEORY_PATH = `${EDUCATION_ROUTE}/theory`;
export const PRACTICE_BASE = `${EDUCATION_ROUTE}/practice`;
export const practicePath = (slug) => `${PRACTICE_BASE}/${slug}`;
