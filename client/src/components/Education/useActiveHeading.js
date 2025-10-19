import { useEffect, useState } from 'react';

export default function useActiveHeading() {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('[data-anchorable="1"]'));
    if (!headings.length) return;

    const io = new IntersectionObserver((entries) => {
      const best = entries.slice().sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best && best.intersectionRatio >= 0.99) {
        const id = best.target.id;
        setActiveId((prev) => (prev === id ? prev : id));
      }
    }, { threshold: [0, 0.5, 0.99, 1] });

    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  return activeId;
}
