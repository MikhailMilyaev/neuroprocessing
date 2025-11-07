import { useEffect, useRef } from 'react';
import { IoMenuOutline } from 'react-icons/io5';
import { FcIdea } from 'react-icons/fc';
import classes from './IdeasHeader.module.css';

export default function IdeasHeader({
  selectMode,
  selectedCount = 0,
  onToggleSelectMode,
  onLampClick,
  onMoveClick,            // открыть модалку перемещения выбранных
  onOpenSidebar = () => {},
  isSidebarOpen = false,
}) {
  const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width:700px)').matches &&
    window.matchMedia('(hover: none)').matches &&
    window.matchMedia('(pointer: coarse)').matches;

  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--ideas-header-h', `${h}px`);
    };
    setH();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(setH) : null;
    ro?.observe(el);
    addEventListener('resize', setH);
    addEventListener('orientationchange', setH);
    return () => {
      ro?.disconnect();
      removeEventListener('resize', setH);
      removeEventListener('orientationchange', setH);
    };
  }, []);

  const burgerProps = {};
  if (!isMobile) {
    burgerProps['aria-hidden'] = isSidebarOpen;
    burgerProps['disabled'] = isSidebarOpen;
    burgerProps['tabIndex'] = isSidebarOpen ? -1 : 0;
  }

  const showMove = selectMode && selectedCount > 0;

  return (
    <div
      ref={headerRef}
      className={`${classes.header} ${classes.headerPaddedMobile} ${isSidebarOpen ? classes.sidebarOpen : ''}`}
    >
      <div className={classes.left}>
        <button
          type="button"
          className={`${classes.iconBtn} ${classes.burger}`}
          onClick={(e) => {
            onOpenSidebar?.();
            if (isMobile) try { e.currentTarget.blur(); } catch {}
          }}
          onTouchEnd={(e) => { if (isMobile) try { e.currentTarget.blur(); } catch {} }}
          onMouseLeave={(e) => { if (isMobile) try { e.currentTarget.blur(); } catch {} }}
          {...burgerProps}
        >
          <IoMenuOutline className={classes.burgerIcon} />
        </button>

        <button
          type="button"
          className={classes.textBtn}
          onClick={onToggleSelectMode}
        >
          {selectMode ? 'Готово' : 'Выбор'}
        </button>
      </div>

      <div className={classes.right}>
        <div className={classes.toolbar} role="toolbar" aria-label="Действия">
          {showMove ? (
            <button
              type="button"
              className={classes.textBtn}
              onClick={onMoveClick}
            >
              Переместить
            </button>
          ) : (
            <button
              type="button"
              className={`${classes.iconBtn} ${classes.lampBtn}`}
              onClick={onLampClick}
              aria-label="Добавить идею"
              title="Добавить идею"
            >
              <FcIdea className={classes.icon} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
