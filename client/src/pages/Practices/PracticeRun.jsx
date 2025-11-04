import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRunByParams } from "../../http/practiceRunsApi";
import { PRACTICES_ROUTE } from "../../utils/consts";
import GoodBadRun from "./GoodBadRun/GoodBadRun";

export default function PracticeRun() {
  const { practiceSlug, ideaSlug } = useParams();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await getRunByParams(practiceSlug, ideaSlug);
        if (on) setRun(r || null);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [practiceSlug, ideaSlug]);

  if (loading) return <div style={{ padding:16 }}>Загрузка…</div>;

  if (!run) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Практика</h1>
        <p>Запуск не найден.</p>
        <Link to={PRACTICES_ROUTE}>← К списку практик</Link>
      </div>
    );
  }

  if (practiceSlug === "good-bad") return <GoodBadRun />;

  return (
    <div style={{ padding: 16 }}>
      <Link to={PRACTICES_ROUTE}>← К списку</Link>
      <h1 style={{ marginTop: 12 }}>{practiceSlug}</h1>
      <p style={{ opacity: 0.8 }}>Идея: {run.ideaText}</p>
      <div style={{ marginTop: 24, padding: 16, border: "1px dashed #bbb", borderRadius: 12 }}>
        Здесь будет интерактивная практика «{practiceSlug}».
      </div>
    </div>
  );
}
