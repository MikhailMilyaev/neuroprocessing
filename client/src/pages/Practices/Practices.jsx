// src/pages/Practices/Practices.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { listRuns } from '../../utils/practiceRuns';
import { PRACTICES_ROUTE } from '../../utils/consts';

export default function Practices() {
  const navigate = useNavigate();
  const runs = listRuns();

  if (!runs.length) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Практики</h1>
        <p>Запусков пока нет. Откройте любую идею и нажмите «Запустить».</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Практики</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {runs.map(r => (
          <button
            key={r.id}
            onClick={() => navigate(`${PRACTICES_ROUTE}/${r.practiceSlug}/${r.ideaSlug}`)}
            style={{
              textAlign: 'left',
              border: '1px solid #e1e1e1',
              borderRadius: 12,
              padding: '12px 14px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {r.practiceSlug === 'good-bad' ? 'Хорошо — Плохо' : r.practiceSlug}
            </div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>
              Идея: {r.ideaText || '—'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
