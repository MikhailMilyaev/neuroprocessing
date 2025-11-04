// src/components/Story/StoryIdeas/PracticePanel/PracticePanel.jsx
import { useLayoutEffect, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./PracticePanel.module.css";
import { practicePath, PRACTICES_ROUTE } from "../../../../utils/consts";
import {
  listRuns,
  createRunIfNeeded,
  slugifyIdea,
} from "../../../../http/practiceRunsApi";

export default function PracticePanel({
  practices = [],
  maxHeight = 420,
  ideaText = "",
}) {
  const navigate = useNavigate();
  const listRef = useRef(null);

  // ==== локальный стейт для уже запущенных практик по текущей идее ====
  const [launchedSet, setLaunchedSet] = useState(() => new Set());
  const encodedIdea = useMemo(() => slugifyIdea(ideaText || ""), [ideaText]);

  const refreshLaunched = useCallback(async () => {
    if (!ideaText) { setLaunchedSet(new Set()); return; }
    try {
      const runs = await listRuns();
      const s = new Set();
      for (const r of runs || []) {
        if (r?.ideaSlug === encodedIdea) s.add(r.practiceSlug);
      }
      setLaunchedSet(s);
    } catch {
      // тихо игнорируем; кнопки всё равно сработают (создание/переход)
      setLaunchedSet(new Set());
    }
  }, [ideaText, encodedIdea]);

  useEffect(() => { refreshLaunched(); }, [refreshLaunched]);

  // ===== авто-скрытие/появление скролла =====
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

  // ==== действия ====
  const openEducation = (p) => {
    const slug = p.slug || p.id;
    if (!slug) return;
    navigate(practicePath(slug));
  };

  const startRun = async (p) => {
    const practiceSlug = p.slug || p.id;
    if (!practiceSlug || !ideaText) return;

    // если уже запущена — просто перейти
    if (launchedSet.has(practiceSlug)) {
      navigate(`${PRACTICES_ROUTE}/${practiceSlug}/${encodedIdea}`);
      return;
    }

    // иначе создать и перейти
    const run = await createRunIfNeeded(practiceSlug, ideaText);
    // обновим локальный список, чтобы кнопка сменилась на "Запущена"
    setLaunchedSet(prev => new Set(prev).add(practiceSlug));
    navigate(`${PRACTICES_ROUTE}/${run.practiceSlug}/${run.ideaSlug}`);
  };

  return (
    <div className={classes.vwrap} style={{ maxHeight }}>
      <ul ref={listRef} className={classes.list}>
        {practices.map((p) => {
          const slug = p.slug || p.id;
          const launched = launchedSet.has(slug);
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
                  disabled={launched || !ideaText}
                  title={
                    !ideaText
                      ? "Сначала введите текст идеи"
                      : (launched
                          ? "Практика по этой идее уже запущена"
                          : "Запустить практику для этой идеи")
                  }
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
