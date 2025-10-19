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

  // Автофокус: берём первую пустую идею (обычно только что добавленную)
  useEffect(() => {
    if (!items || items.length === 0) return;

    // приоритет: самая верхняя пустая идея; если есть временная (id < 0) — её
    const candidate =
      items.find((it) => it.id < 0) ||
      items.find((it) => String(it.text || '').trim() === '');

    if (!candidate) return;

    const key = candidate.uiKey;
    if (lastAutoFocusKeyRef.current === key) return; // не дёргаем повторно

    // подождём, пока ref попадёт в карту
    const tryFocus = (tries = 12) => {
      const el = inputRefs.current.get(key);
      if (el) {
        try {
          el.focus({ preventScroll: true });
        } catch {
          try { el.focus(); } catch {}
        }
        // курсор в конец
        const len = el.value?.length ?? 0;
        try { el.setSelectionRange(len, len); } catch {}
        lastAutoFocusKeyRef.current = key;
        return;
      }
      if (tries > 0) setTimeout(() => tryFocus(tries - 1), 30);
    };

    // два тика на всякий случай
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
            aria-label="Действия"
            disabled={selectMode}
            title={selectMode ? 'Недоступно в режиме выбора' : 'Действия'}
          >
            ⋯
          </button>
        </div>
      ))}
    </div>
  );
}
