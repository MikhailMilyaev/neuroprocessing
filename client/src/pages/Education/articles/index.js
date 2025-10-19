import { lazy } from 'react';

export const ARTICLE_META = [
  { slug: 'basics',   title: 'NEUROPROCESSING — основы' },
  { slug: 'advanced', title: 'NEUROPROCESSING — подробная теория' },
  { slug: 'good-bad', title: 'Практика «Хорошо — Плохо»' },
];

export const ARTICLE_LOADERS = {
  basics:   lazy(() => import('./Basics/Basics')),
  advanced: lazy(() => import('./Advanced/Advanced')),
  'good-bad': lazy(() => import('./GoodBad/GoodBad')),
};
