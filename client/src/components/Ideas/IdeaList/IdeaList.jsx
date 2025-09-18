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
  return (
    <div className={`${classes.list} ${selectMode ? classes.selecting : ''}`}>
      {items.map(it => (
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
