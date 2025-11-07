import { useEffect, useRef } from "react";
import { useOutletContext as useRRDOutletContext } from "react-router-dom";
import classes from "./StoryHeader.module.css";
import { IoMenuOutline } from "react-icons/io5";
import { FcIdea } from "react-icons/fc";
import { BsThreeDots } from "react-icons/bs";

const StoryHeader = ({
  title = "",
  onTitleChange = () => {},
  onTitleBlur = () => {},
  onAddBelief = () => {},
  onOpenMenu = () => {},
  menuOpen = false,
  onOpenSidebar: onOpenSidebarProp,
  isSidebarOpen: isSidebarOpenProp,
}) => {
  let outlet = {};
  try {
    outlet = (typeof useRRDOutletContext === "function" ? (useRRDOutletContext() || {}) : {});
  } catch {}

  const onOpenSidebar = onOpenSidebarProp ?? outlet.onOpenSidebar ?? (() => {});
  const isSidebarOpen = isSidebarOpenProp ?? outlet.isSidebarOpen ?? false;

  // детектор мобилки (для «гасим фон» у бургера и не-блокировки кнопки)
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  // синхроним высоту (оставляем как было)
  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--story-header-h", `${h}px`);
    };
    setH();
    const ro = "ResizeObserver" in window ? new ResizeObserver(setH) : null;
    ro?.observe(el);
    addEventListener("resize", setH);
    addEventListener("orientationchange", setH);
    return () => {
      ro?.disconnect();
      removeEventListener("resize", setH);
      removeEventListener("orientationchange", setH);
    };
  }, []);

  // на десктопе можно блокировать бургер при открытом сайдбаре
  const burgerProps = {};
  if (!isMobile) {
    burgerProps["aria-hidden"] = isSidebarOpen;
    burgerProps["disabled"] = isSidebarOpen;
    burgerProps["tabIndex"] = isSidebarOpen ? -1 : 0;
  }

  return (
    <div
      ref={headerRef}
      className={`${classes.header} ${classes.headerPaddedMobile} ${isSidebarOpen ? classes.sidebarOpen : ""}`}
    >
      <div className={classes.left}>
        <button
          type="button"
          className={classes.burger}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenSidebar?.();
            // Мобилка: гасим любой hover/active/focus, чтобы «не горел»
            if (isMobile) try { e.currentTarget.blur(); } catch {}
          }}
          onTouchEnd={(e) => { if (isMobile) try { e.currentTarget.blur(); } catch {} }}
          onMouseLeave={(e) => { if (isMobile) try { e.currentTarget.blur(); } catch {} }}
          aria-label="Открыть меню"
          title="Меню"
          {...burgerProps}
        >
          <IoMenuOutline className={classes.burgerIcon} />
        </button>

        <input
          name="title"
          type="text"
          placeholder="Сформулируйте проблему"
          aria-label="Заголовок истории"
          value={title}
          maxLength={120}
          onChange={(e) => onTitleChange?.(e.target.value)}
          onBlur={onTitleBlur}
          className={classes.titleInput}
        />
      </div>

      <div className={classes.right}>
        <div className={classes.toolbar} role="toolbar" aria-label="Действия">
          <button
            type="button"
            className={`${classes.tbtn} ${classes.lampBtn}`}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onAddBelief?.("pointer"); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddBelief?.("click"); }}
            aria-label="Добавить идею"
            title="Добавить идею"
          >
            <FcIdea className={classes.icon} />
          </button>

          <button
            type="button"
            className={`${classes.tbtn} ${classes.menuBtn} ${menuOpen ? classes.menuBtnActive : ""}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenMenu?.(e); }}
            onContextMenu={(e) => { e.preventDefault(); onOpenMenu?.(e); }}
            aria-label="Меню"
            title="Меню"
          >
            <BsThreeDots className={classes.icon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryHeader;
