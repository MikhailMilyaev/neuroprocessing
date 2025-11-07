export const LANDING_ROUTE = '/';
export const LOGIN_ROUTE = '/login';
export const REGISTRATION_ROUTE = '/registration';
export const CHECKEMAIL_ROUTE = '/check-email';
export const ACTIVATED_ROUTE = '/account-activated';

export const RESET_ROUTE = '/reset';
export const RESET_SENT_ROUTE = '/reset-sent';
export const RESET_PASSWORD_ROUTE = '/reset-password';
export const RESET_SUCCESS_ROUTE = '/reset-success';

export const STORIES_ROUTE = '/stories';
export const STORY_ROUTE = '/story';
export const IDEA_DRAFTS_ROUTE = '/idea-drafts';

export const PRACTICES_ROUTE = '/practices';
export const PRACTICE_ROUTE = `${PRACTICES_ROUTE}/:practiceSlug/:ideaSlug`;

export const practicePath = (slug) => `${EDUCATION_ROUTE}/${slug}`;

export const EDUCATION_ROUTE = '/education'

export const NOTFOUND_ROUTE = '/404';
