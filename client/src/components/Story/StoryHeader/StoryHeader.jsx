import { useEffect, useRef } from "react";
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
  onBack,
}) => {
  const hasRound = (reevalRound ?? 0) > 0;

  // меряем высоту хедера — нужно: (1) отступ под ним, (2) позиция меню
  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--story-header-h', `${h}px`);
    };
    setH();

    const ro = ('ResizeObserver' in window) ? new ResizeObserver(setH) : null;
    ro?.observe(el);
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', setH);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', setH);
      window.removeEventListener('orientationchange', setH);
    };
  }, []);

  return (
    <div ref={headerRef} className={classes.header} data-lock-scroll="true">
      <button
        type="button"
        className={classes.backBtn}
        onClick={onBack}
        aria-label="Назад к историям"
        title="Истории"
      >
        <span className={classes.backChevron} aria-hidden>‹</span>
        Истории
      </button>

      <input
        name="title"
        type="text"
        placeholder="Сформулируйте проблему"
        aria-label="Заголовок истории"
        value={title}
        maxLength={64}
        onChange={(e) => onTitleChange?.(e.target.value)}
        onBlur={onTitleBlur}
        className={`${classes.titleInput} ${classes.titleInputDesktop}`}
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
        <button type="button" className={classes.iconBtn} onClick={onUndo} disabled={!canUndo} aria-label="Назад">
          <IoChevronBack />
        </button>
        <button type="button" className={classes.iconBtn} onClick={onRedo} disabled={!canRedo} aria-label="Вперёд">
          <IoChevronForward />
        </button>
<button
  type="button"
  className={`${classes.iconBtn} ${classes.lampBtn}`}
  onPointerDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddBelief?.('pointer'); // <-- ВАЖНО: сообщаем, что это pointer-жест
  }}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddBelief?.('click'); // запасной вариант для десктопа
  }}
  aria-label="Добавить идею"
>
  <FcIdea />
</button>
        <button
          type="button"
          className={`${classes.iconBtn} ${classes.menuBtn} ${menuOpen ? classes.menuBtnActive : ''}`}
          onClick={onOpenMenu}
          onContextMenu={(e) => { e.preventDefault(); onOpenMenu(e); }}
          aria-label="Меню"
        >
          <HiMiniSquares2X2 />
        </button>
      </div>
    </div>
  );
};

export default StoryHeader;
