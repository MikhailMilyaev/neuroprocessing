import classes from './StoryHeader.module.css';
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FcIdea } from "react-icons/fc";
import { HiMiniSquares2X2 } from "react-icons/hi2";

const StoryHeader = ({
  title,
  onTitleChange,
  onTitleBlur,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddBelief,
  onOpenMenu,
  menuOpen,
  reevalRound = 0,
}) => {
  const hasRound = (reevalRound ?? 0) > 0;

  return (
    <div className={classes.header}>
      <input
        name="title"
        type="text"
        placeholder="Сформулируйте проблему"
        aria-label="Заголовок истории"
        value={title}
        maxLength={64}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onTitleBlur}
        className={classes.titleInput}
      />

      {hasRound && (
        <div
          className={classes.reevalPill}
          aria-label={`Переоценка ${reevalRound}`}
          title={`Переоценка ${reevalRound}`}
        >
          Переоценка {reevalRound}
        </div>
      )}

      <div className={classes.actions}>
        <button
          type="button"
          className={classes.iconBtn}
          data-nav="prev"
          onClick={onUndo}
          disabled={!canUndo}
          title="Назад"
          aria-label="Назад"
        >
          <IoChevronBack />
        </button>

        <button
          type="button"
          className={classes.iconBtn}
          data-nav="next"
          onClick={onRedo}
          disabled={!canRedo}
          title="Вперёд"
          aria-label="Вперёд"
        >
          <IoChevronForward />
        </button>

        <button
          type="button"
          className={`${classes.iconBtn} ${classes.lampBtn}`}
          onClick={onAddBelief}
          title="Добавить идею"
          aria-label="Добавить идею"
        >
          <FcIdea />
        </button>

        <button
          type="button"
          className={`${classes.iconBtn} ${classes.menuBtn} ${menuOpen ? classes.menuBtnActive : ''}`}
          onClick={onOpenMenu}
          onContextMenu={(e) => { e.preventDefault(); onOpenMenu(e); }}
          title="Меню"
          aria-label="Меню"
        >
          <HiMiniSquares2X2 />
        </button>
      </div>
    </div>
  );
};

export default StoryHeader;
