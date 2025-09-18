import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import classes from "./Reminders.module.css";
import { IoPlay, IoPause } from "react-icons/io5";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const DEFAULT_ITEMS = [
  "Что вы чувствовали в этот момент?",
  "Какая мысль была самой громкой?",
  "Какое действие вы пытались избежать?",
  "Что для вас было самым важным прямо сейчас?",
  "Если бы можно было возвращаться — что бы вы сделали иначе?"
];

// стабильная пустая ссылка для линтера/мемо
const EMPTY = Object.freeze([]);

export default function Reminders({
  visible = false,
  items = DEFAULT_ITEMS,

  // контролируемый индекс (персист из БД)
  index,                 // number | undefined
  onIndexChange,         // (nextIdx:number) => void

  // частота автопереключения; null/undefined/<=0 = таймер не крутится
  freqSec = 30,

  // внешняя пауза (из родителя/БД)
  pausedExternal = false,
  onPauseChange,         // (paused:boolean) => void
}) {
  const controlled = typeof index === "number";
  const [idx, setIdx] = useState(controlled ? index : 0);

  // актуальный индекс в ref для setInterval
  const currentIdxRef = useRef(idx);
  useEffect(() => { currentIdxRef.current = controlled ? index : idx; }, [controlled, index, idx]);

  // единый сеттер индекса (исправляет линтер и др.)
  const setIdxBoth = useCallback((next) => {
    const value = (typeof next === "function") ? next(currentIdxRef.current) : next;
    if (!controlled) setIdx(value);
    onIndexChange?.(value);
  }, [controlled, onIndexChange]);

  const [pausedLocal, setPausedLocal] = useState(false);
  const effectivePaused = pausedLocal || pausedExternal;

  const safeItems = Array.isArray(items) ? items : EMPTY;

  const shown = useMemo(() => {
    const len = Math.max(safeItems.length, 1);
    const raw = controlled ? (index ?? 0) : idx;
    const safeIdx = ((raw % len) + len) % len;
    return safeItems.length ? safeItems[safeIdx] : "";
  }, [safeItems, controlled, index, idx]);

  const timerRef = useRef(null);
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  useEffect(() => {
    clearTimer();
    if (!visible) return;
    if (effectivePaused) return;
    const n = Number(freqSec);
    if (!Number.isFinite(n) || n <= 0) return;

    const intervalMs = Math.max(1, n) * 1000;
    timerRef.current = setInterval(() => {
      setIdxBoth((v) => {
        const len = Math.max(safeItems.length, 1);
        return (v + 1) % len;
      });
    }, intervalMs);

    return clearTimer;
  }, [visible, effectivePaused, freqSec, safeItems.length, setIdxBoth]);

  useEffect(() => () => clearTimer(), []);

  const togglePause = () => {
    const next = !effectivePaused;
    setPausedLocal(next);
    onPauseChange?.(next);
  };

  const prev = () => setIdxBoth((v) => {
    const len = Math.max(safeItems.length, 1);
    return (v - 1 + len) % len;
  });
  const next = () => setIdxBoth((v) => {
    const len = Math.max(safeItems.length, 1);
    return (v + 1) % len;
  });

  if (!visible) return null;

  return (
    <div className={classes.wrap} role="group" aria-label="Напоминания">
      <div className={classes.question} title={shown}>{shown}</div>
      <div className={classes.controls}>
        <button type="button" className={classes.iconBtn} onClick={prev} title="Предыдущее напоминание" aria-label="Предыдущее">
          <IoChevronBack />
        </button>
        <button
          type="button"
          className={`${classes.iconBtn} ${classes.pauseBtn}`}
          onClick={togglePause}
          title={effectivePaused ? "Продолжить" : "Пауза"}
          aria-label={effectivePaused ? "Продолжить" : "Пауза"}
        >
          {effectivePaused ? <IoPlay /> : <IoPause />}
        </button>
        <button type="button" className={classes.iconBtn} onClick={next} title="Следующее напоминание" aria-label="Следующее">
          <IoChevronForward />
        </button>
      </div>
    </div>
  );
}
