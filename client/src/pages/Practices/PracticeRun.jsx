// src/pages/Practices/PracticeRun.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRunByParams } from '../../utils/practiceRuns';
import { PRACTICES_ROUTE } from '../../utils/consts';

// страница конкретной практики «Хорошо — Плохо»
import GoodBadRun from './GoodBadRun/GoodBadRun';

export default function PracticeRun() {
  const { practiceSlug, ideaSlug } = useParams(); // ideaSlug тут обычно DECODED
  const run = getRunByParams(practiceSlug, ideaSlug); // функция сама нормализует

  if (!run) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Практика</h1>
        <p>Запуск не найден.</p>
        <Link to={PRACTICES_ROUTE}>← К списку практик</Link>
      </div>
    );
  }

  // роутер по типу практики
  if (practiceSlug === 'good-bad') {
    // GoodBadRun сам прочитает ideaSlug из useParams — там всё ок
    return <GoodBadRun />;
  }

  // заглушка для будущих практик
  return (
    <div style={{ padding: 16 }}>
      <Link to={PRACTICES_ROUTE}>← К списку</Link>
      <h1 style={{ marginTop: 12 }}>{practiceSlug}</h1>
      <p style={{ opacity: 0.8 }}>Идея: {run.ideaText}</p>
      <div style={{ marginTop: 24, padding: 16, border: '1px dashed #bbb', borderRadius: 12 }}>
        Здесь будет интерактивная практика «{practiceSlug}».
      </div>
    </div>
  );
}
