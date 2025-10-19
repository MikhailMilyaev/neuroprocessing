import { useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./PracticePanel.module.css";
import { practicePath, PRACTICES_ROUTE } from "../../../../utils/consts";
import { createRunIfNeeded, hasRun, slugifyIdea } from "../../../../utils/practiceRuns";

export default function PracticePanel({
  practices = [],
  maxHeight = 420,
  ideaText = "",
}) {
  const navigate = useNavigate();
  const listRef = useRef(null);

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

  if (!practices || practices.length === 0) return null;

  const runsMap = useMemo(() => {
    const m = new Map();
    for (const p of practices) {
      const slug = p.slug || p.id;
      m.set(slug, hasRun(slug, ideaText));
    }
    return m;
  }, [practices, ideaText]);

  const openEducation = (p) => {
    const slug = p.slug || p.id;
    if (!slug) return;
    // Ведём в статью обучения: /education/<slug>
    navigate(practicePath(slug));
  };

  const startRun = (p) => {
    const practiceSlug = p.slug || p.id;
    if (!practiceSlug || !ideaText) return;

    // Если уже запущена — просто перейти к запущенной
    if (runsMap.get(practiceSlug)) {
      const ideaSlug = slugifyIdea(ideaText);
      navigate(`${PRACTICES_ROUTE}/${practiceSlug}/${ideaSlug}`);
      return;
    }

    // Иначе создать и перейти
    const run = createRunIfNeeded(practiceSlug, ideaText);
    navigate(`${PRACTICES_ROUTE}/${run.practiceSlug}/${run.ideaSlug}`);
  };

  return (
    <div className={classes.vwrap} style={{ maxHeight }}>
      <ul ref={listRef} className={classes.list}>
        {practices.map((p) => {
          const slug = p.slug || p.id;
          const launched = runsMap.get(slug);
          return (
            <li key={slug} className={classes.row}>
              <div className={classes.title} title={p.title}>
                {p.title}
              </div>

              <div className={classes.actions}>
                <button
                  type="button"
                  className={classes.educationBtn}
                  onClick={() => openEducation(p)}
                  title="Открыть обучение по практике"
                >
                  Обучение
                </button>

                <button
                  type="button"
                  className={`${classes.runBtn} ${launched ? classes.runBtnDisabled : ""}`}
                  onClick={() => !launched && startRun(p)}
                  disabled={launched}
                  title={launched ? "Практика по этой идее уже запущена" : "Запустить практику для этой идеи"}
                >
                  {launched ? "Запущена" : "Запустить"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
