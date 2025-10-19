import React from 'react';
import ArticleShell from '../../../../components/Education/ArticleShell';
import sectionsRaw from './good_bad_sections.json';

export default function GoodBad() {
  return (
    <ArticleShell
      pageTitle="Практика «Хорошо — Плохо»"
      mobileTitle="Хорошо — Плохо"
      sections={sectionsRaw}
    />
  );
}
