import React from 'react';
import ArticleShell from '../../../../components/Education/ArticleShell';
import { enhanceCitations, sortChildrenByNumber } from '../../../../components/Education/utils';
import sectionsRaw from './neuroprocessing_sections_v9.json';

const sections = sortChildrenByNumber(enhanceCitations(sectionsRaw));

export default function Basics() {
  return (
    <ArticleShell
      pageTitle="Neuroprocessing: Пошаговый алгоритм психологической самопомощи"
      mobileTitle="Основы"
      sections={sections}
    />
  );
}
