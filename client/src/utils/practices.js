export const PRACTICES = [
  {
    slug: 'good-bad',
    title: 'Хорошо — Плохо',
    description: 'Совсем скоро..',
  },
  {
    slug: 'importance-comparing',     
    title: 'Сравнение важностей',
    description: 'Совсем скоро...'
  }
];

export const practiceMap = new Map(PRACTICES.map(p => [p.slug, p]));
