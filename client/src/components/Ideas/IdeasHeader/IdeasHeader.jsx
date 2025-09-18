import classes from './IdeasHeader.module.css';

export default function IdeasHeader({
  title = 'Идеи на обработку',
  selectMode,
  selectedCount = 0,
  onToggleSelectMode,
  onPrimaryClick,
}) {
  const primaryLabel = selectMode ? 'Переместить в…' : 'Добавить идею';
  const primaryDisabled = selectMode && selectedCount === 0;

  return (
    <div className={classes.topbar}>
      <button
        className={`${classes.hdrBtn} ${classes.selectBtn}`}
        onClick={onToggleSelectMode}
      >
        {selectMode ? 'Готово' : 'Выбор'}
      </button>

      <div className={classes.title}>{title}</div>

      <button
        className={`${classes.hdrBtn} ${selectMode ? classes.moveBtn : classes.addBtn}`}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        title={primaryDisabled ? 'Выберите идеи' : undefined}
      >
        {primaryLabel}
      </button>
    </div>
  );
}
