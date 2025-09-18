import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./PracticePanel.module.css";
import { practicePath } from "../../../../utils/consts";

export default function PracticePanel({ practices = [], maxHeight = 420 }) {
  const navigate = useNavigate();
  const listRef = useRef(null);

  // Хук всегда вызывается, а внутри уже безопасные проверки
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const updateOverflow = () => {
      const needsScroll = el.scrollHeight > el.clientHeight + 1;
      el.style.overflowY = needsScroll ? "auto" : "hidden";
    };

    updateOverflow();

    const ro = new ResizeObserver(updateOverflow);
    ro.observe(el);

    const onResize = () => updateOverflow();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [practices.length, maxHeight]);

  // Условный рендер переносим ПОСЛЕ всех хуков
  if (!practices || practices.length === 0) return null;

  const openPractice = (p) => {
    const slug = p.slug || p.id;
    if (!slug) return;
    navigate(practicePath(slug));
  };

  return (
    <div className={classes.vwrap} style={{ maxHeight }}>
      <ul ref={listRef} className={classes.list}>
        {practices.map((p) => (
          <li key={p.slug || p.id} className={classes.row}>
            <div className={classes.title} title={p.title}>
              {p.title}
            </div>
            <button
              type="button"
              className={classes.openBtn}
              onClick={() => openPractice(p)}
            >
              Открыть
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
