import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import PracticePanel from '../PracticePanel/PracticePanel';
import classes from './IdeaItem.module.css';
import { PRACTICES } from '../../../../http/practiceApi';

export default function IdeaItem({
  id,
  text,
  score,
  introducedRound = 0,
  reevalRound = 0,
  isArchived = false,
  isLeavingActive = false,
  isLeavingArchive = false,
  isReenter = false,
  isEnteringArchive = false,
  onTextChange,
  onScoreChange,
  onBlurEmpty,
  practices = [],
  registerScoreRef,
  onScoreFinalized,
  registerTextRef,
  onTextArrow,
}) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);
  const textInputRef  = useRef(null);
  const scoreInputRef = useRef(null);
  const scoreWrapRef = useRef(null);
  const practiceSlotRef = useRef(null);
  const [fieldFocused, setFieldFocused] = useState(false);

  const bannedKeys = new Set(['+', '-', 'e', 'E', ',', '.']);

  const effPractices = Array.isArray(practices) && practices.length > 0 ? practices : PRACTICES;
  const hasText = !!(text && text.trim().length);

  // можно показать UI практик, но сам переключатель может быть disabled, когда нет текста
  const canShowPracticesUI = !isArchived && effPractices.length > 0;

  const isOpen = canShowPracticesUI && open;

  const toggleOpen = () => {
    setOpen(prev => !prev);
  };

  useEffect(() => {
    if (isArchived) setOpen(false);
  }, [isArchived]);

  const handleFieldFocus = () => {
    setFieldFocused(true);
  };

  const handleFieldBlur = () => {
    requestAnimationFrame(() => {
      const el = rootRef.current;
      const a = document.activeElement;
      const stillInside = el && a && el.contains(a);
      setFieldFocused(!!stillInside);
    });
  };

  const stopFocusOnRight = (e) => {
    const root = rootRef.current;
    const scoreWrap = scoreWrapRef.current;
    if (!root || !scoreWrap) return;
    if (scoreWrap.contains(e.target)) return;

    const rowRect = root.getBoundingClientRect();
    const scoreRect = scoreWrap.getBoundingClientRect();

    const isYInsideRow = e.clientY >= rowRect.top && e.clientY <= rowRect.bottom;
    const isRightOfScore = e.clientX >= scoreRect.left;

    if (isYInsideRow && isRightOfScore) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const isActive = isOpen || fieldFocused;

  useLayoutEffect(() => {
    if (!isOpen) return;
    const slot = practiceSlotRef.current;
    if (!slot) return;
  }, [isOpen, effPractices.length]);

  useEffect(() => {
    if (typeof registerScoreRef === 'function') {
      registerScoreRef(id, scoreInputRef.current);
      return () => registerScoreRef(id, null);
    }
  }, [id, registerScoreRef]);

  useEffect(() => {
    if (typeof registerTextRef === 'function') {
      registerTextRef(id, textInputRef.current);
      return () => registerTextRef(id, null);
    }
  }, [id, registerTextRef]);

  const finalizeTimerRef = useRef(null);
  const clearFinalizeTimer = () => {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
  };

  const scheduleFinalize = (rawValue, opts = {}) => {
    clearFinalizeTimer();
    const str = String(rawValue ?? '');
    if (str === '') return;
    const n = Number(str);
    if (!Number.isFinite(n)) return;
    if (document.activeElement !== scoreInputRef.current) return;

    let delay = 100;
    finalizeTimerRef.current = setTimeout(() => {
      if (document.activeElement !== scoreInputRef.current) return;
      onScoreFinalized?.(id, str, opts);
    }, delay);
  };

  useEffect(() => () => clearFinalizeTimer(), []);

  const handleTextKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      const dir = e.key === 'ArrowUp' ? -1 : 1;
      onTextArrow?.(id, dir);
    }
  };

  return (
    <div
      ref={rootRef}
      className={[
        classes.beliefWrap,
        isActive ? classes.active : '',
        isArchived ? classes.archived : '',
        isEnteringArchive ? classes.archivedEnter : '',
        isLeavingActive ? classes.leaving : '',
        isLeavingArchive ? classes.archivedLeaving : '',
        isReenter ? classes.reenter : '',
      ].filter(Boolean).join(' ')}
      onMouseDownCapture={stopFocusOnRight}
      onTouchStartCapture={stopFocusOnRight}
    >
      <input
        ref={textInputRef}
        id={`belief-input-${id}`}
        name={`beliefText-${id}`}
        className={classes.beliefInput}
        placeholder=""
        value={text}
        onChange={(e) => onTextChange(id, e.target.value)}
        onKeyDown={handleTextKeyDown}
        onFocus={handleFieldFocus}
        onBlur={() => {
          handleFieldBlur();
          onBlurEmpty(id);
        }}
      />

      <div className={classes.scoreWrap} ref={scoreWrapRef}>
        {canShowPracticesUI && (
          <button
            type="button"
            className={`${classes.iconBtn} ${classes.scoreToggleBtn} ${open ? classes.open : ''}`}
            aria-label={
              !hasText
                ? 'Сначала введите текст идеи'
                : open
                  ? 'Скрыть практики'
                  : 'Показать практики'
            }
            title={
              !hasText
                ? 'Сначала введите текст идеи, чтобы увидеть практики'
                : open
                  ? 'Скрыть практики'
                  : 'Показать практики'
            }
            aria-expanded={open}
            disabled={!hasText}
            onClick={(e) => {
              if (!hasText) return;
              e.stopPropagation();
              toggleOpen();
            }}
            onFocus={handleFieldFocus}
            onBlur={handleFieldBlur}
          >
            <IoChevronDown />
          </button>
        )}

        <input
          ref={scoreInputRef}
          className={classes.beliefScore}
          name={`beliefScore-${id}`}
          type="number"
          inputMode="numeric"
          step="1"
          pattern="\d*"
          min={0}
          max={10}
          placeholder=""
          value={score}
          onChange={(e) => {
            const raw = e.target.value || '';
            const clean = raw.replace(/[^\d]/g, '');
            onScoreChange(id, clean);
            if (clean === '0') {
              clearFinalizeTimer();
              onScoreFinalized?.(id, '0', { direction: 1 });
            } else {
              scheduleFinalize(clean, { direction: 1 });
            }
          }}
          onKeyDown={(e) => {
            if (bannedKeys.has(e.key) || e.key === ' ') {
              e.preventDefault();
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              clearFinalizeTimer();
              onScoreFinalized?.(id, String(e.currentTarget.value ?? ''), { direction: 1 });
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              clearFinalizeTimer();
              onScoreFinalized?.(id, String(e.currentTarget.value ?? ''), { direction: 1 });
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              clearFinalizeTimer();
              onScoreFinalized?.(id, String(e.currentTarget.value ?? ''), { direction: -1 });
            } else if (e.key === 'Tab') {
              clearFinalizeTimer();
            }
          }}
          onPaste={(e) => {
            const t = (e.clipboardData.getData('text') || '').replace(/[^\d]/g, '');
            if (t !== e.clipboardData.getData('text')) {
              e.preventDefault();
              const input = e.currentTarget;
              const start = input.selectionStart || 0;
              const end = input.selectionEnd || 0;
              const next = (input.value || '').slice(0, start) + t + (input.value || '').slice(end);
              onScoreChange(id, next);
            }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          onFocus={handleFieldFocus}
          onBlur={(e) => {
            handleFieldBlur();
            const v = e.target.value;
            const isEmpty = v === '' || v == null;
            if (isArchived && isEmpty) {
              onScoreChange(id, '0');
            }
            clearFinalizeTimer();
          }}
          disabled={!hasText}
          title={!hasText ? 'Сначала введите текст идеи' : 'Оценка 0–10'}
        />
      </div>

      {isOpen && (
        <div className={classes.practiceSlot} ref={practiceSlotRef}>
          <PracticePanel practices={effPractices} ideaText={text} />
        </div>
      )}
    </div>
  );
}
