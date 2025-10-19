import classes from './IdeasHeader.module.css';
import { IoAdd } from 'react-icons/io5';

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
      {/* слева — «Выбор / Готово» */}
      <button
        className={`${classes.hdrBtn} ${classes.selectBtn}`}
        onClick={onToggleSelectMode}
      >
        {selectMode ? 'Готово' : 'Выбор'}
      </button>

      {/* центр — заголовок */}
      <div className={classes.title}>{title}</div>

      {/* справа — на десктопе большая кнопка, на мобилке круглая с плюсиком */}
      <button
        className={`${classes.hdrBtn} ${selectMode ? classes.moveBtn : classes.addBtn}`}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        title={primaryDisabled ? 'Выберите идеи' : undefined}
      >
        <span className={classes.addText}>{primaryLabel}</span>
        <span className={classes.addIcon} aria-hidden>
          <IoAdd />
        </span>
      </button>
    </div>
  );
}
