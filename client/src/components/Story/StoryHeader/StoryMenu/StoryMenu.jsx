import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RiArchive2Fill } from "react-icons/ri";
import { LuArrowUpDown } from "react-icons/lu";
import { TbRefresh } from "react-icons/tb";
import classes from './StoryMenu.module.css';

const MENU_W = 243;
const MARGIN = 8;

const StoryMenu = ({
  open,
  position,                 
  onClose,
  onSort,
  onReevaluate,
  archiveEnabled,
  onToggleArchive,
  sorted,
  onArchiveStory,
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  let vw = 0;
  let headerH = 56;
  if (typeof window !== 'undefined') {
    vw = window.innerWidth || 0;
    const cssH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--story-header-h')
    );
    if (!Number.isNaN(cssH) && cssH > 0) headerH = cssH;
  }

  const pxX = typeof position?.x === 'number' ? position.x : (vw - MARGIN);
  const pxY = typeof position?.y === 'number' ? position.y : (headerH + 6);

  let calcLeft = pxX - MENU_W;
  calcLeft = Math.min(calcLeft, vw - MENU_W - MARGIN);
  calcLeft = Math.max(calcLeft, MARGIN);
  const calcTop = Math.max(pxY, headerH + 6);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classes.menuDialog}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      aria-label="Меню истории"
    >
      <div
        className={classes.menu}
        style={{ top: `${calcTop}px`, left: `${calcLeft}px` }}
        role="menu"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={classes.item}
          role="menuitem"
          onClick={() => { onSort?.(); onClose?.(); }}
        >
          <LuArrowUpDown className={classes.icon} />
          <span className={classes.label}>{sorted ? 'Вернуть' : 'Сортировать'}</span>
        </button>

        <button
          className={classes.item}
          role="menuitem"
          onClick={() => { onReevaluate?.(); onClose?.(); }}
        >
          <TbRefresh className={classes.icon} />
          <span className={classes.label}>Переоценить</span>
        </button>

        <button
          className={classes.item}
          role="menuitem"
          onClick={() => { onClose?.(); onArchiveStory?.(); }}
        >
          <RiArchive2Fill className={classes.icon} />
          <span className={classes.label}>Архивировать историю</span>
        </button>

        <div className={`${classes.item} ${classes.switchRow}`} role="menuitem">
          <RiArchive2Fill className={classes.icon} />
          <span className={classes.label}>Архив идей</span>
          <label className={classes.switch} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={!!archiveEnabled}
              onChange={(e) => onToggleArchive?.(e.target.checked)}
            />
            <span className={classes.slider} />
          </label>
        </div>
      </div>
    </dialog>,
    document.getElementById('storyMenu')
  );
};

export default StoryMenu;