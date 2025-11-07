import { useEffect, useRef } from 'react';
import classes from './IdeaList.module.css';

export default function IdeaList({
  items,
  selectMode,
  isSelected,
  toggleSelect,
  onChange,
  onBlurEmpty,
  onOpenMenu,
  inputRefs,
}) {
  const lastAutoFocusKeyRef = useRef(null);

  // автофокус для только что созданной/пустой идеи
  useEffect(() => {
    if (!items || items.length === 0) return;

    const candidate =
      items.find((it) => it.id < 0) ||
      items.find((it) => String(it.text || '').trim() === '');

    if (!candidate) return;

    const key = candidate.uiKey;
    if (lastAutoFocusKeyRef.current === key) return;

    const tryFocus = (tries = 12) => {
      const el = inputRefs.current.get(key);
      if (el) {
        try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch {} }
        const len = el.value?.length ?? 0;
        try { el.setSelectionRange(len, len); } catch {}
        lastAutoFocusKeyRef.current = key;
        return;
      }
      if (tries > 0) setTimeout(() => tryFocus(tries - 1), 30);
    };
    setTimeout(() => tryFocus(), 0);
  }, [items, inputRefs]);

  return (
    <div className={`${classes.list} ${selectMode ? classes.selecting : ''}`}>
      {items.map((it) => (
        <div key={it.uiKey} className={classes.row}>
          {selectMode && (
            <label className={classes.checkWrap}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={isSelected(it.id)}
                onChange={() => toggleSelect(it.id)}
              />
              <span className={classes.fakeBox} />
            </label>
          )}

          <input
            ref={(el) => {
              if (el) inputRefs.current.set(it.uiKey, el);
              else inputRefs.current.delete(it.uiKey);
            }}
            className={classes.input}
            value={it.text}
            placeholder=""
            onChange={(e) => onChange(it.id, it.uiKey, e.target.value)}
            onBlur={() => onBlurEmpty(it.id, it.uiKey)}
          />

          <button
            type="button"
            className={classes.moreBtn}
            onClick={() => onOpenMenu(it.id)}
            disabled={selectMode}
            aria-label="Действия"
          >
            ⋯
          </button>
        </div>
      ))}
    </div>
  );
}
