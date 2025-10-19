import React from 'react';
import ArticleShell from '../../../../components/Education/ArticleShell';
import { enhanceCitations, sortChildrenByNumber } from '../../../../components/Education/utils';
import sectionsRaw from './neuroprocessing_sections_v6.json';

const sections = sortChildrenByNumber(enhanceCitations(sectionsRaw));

export default function Advanced() {
  return (
    <ArticleShell
      pageTitle="Neuroprocessing: Подробная теория и научные обоснования"
      mobileTitle="Подробная теория"
      sections={sections}
    />
  );
}
