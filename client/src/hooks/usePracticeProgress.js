import { useEffect, useState } from 'react';
import { getProgress } from '../http/practiceApi';

export default function usePracticeProgress() {
  const [map, setMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getProgress();
        if (alive) setMap(data || {});
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const isPassed = (slug) => !!map?.[slug]?.passed;

  return { progress: map, isPassed, loading, setProgress: setMap };
}
