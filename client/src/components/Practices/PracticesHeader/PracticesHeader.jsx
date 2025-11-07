import { useEffect, useRef } from "react";
import { IoMenuOutline, IoAdd } from "react-icons/io5";
import classes from "./PracticesHeader.module.css";

/**
 * Хедер списка практик:
 * - слева бургер (как в Stories);
 * - справа плюс;
 * - без заголовка; центр пустой;
 * - sticky; safe-area как в Stories.
 */
export default function PracticesHeader({
  onAdd = () => {},
  onOpenSidebar = () => {},
  isSidebarOpen = false,
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--practices-header-h", `${h}px`);
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

  // десктоп: блокируем бургер, когда открыт сайдбар
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
          className={`${classes.iconBtn} ${classes.burger}`}
          onClick={(e) => {
            onOpenSidebar?.();
            if (isMobile) try { e.currentTarget.blur(); } catch {}
          }}
          onTouchEnd={(e) => { if (isMobile) try { e.currentTarget.blur(); } catch {} }}
          onMouseLeave={(e) => { if (isMobile) try { e.currentTarget.blur(); } catch {} }}
          aria-label="Открыть меню"
          {...burgerProps}
        >
          <IoMenuOutline className={classes.icon} />
        </button>
      </div>

      <div className={classes.center} aria-hidden="true" />

      <div className={classes.right}>
        <button
          type="button"
          className={classes.iconBtn}
          onClick={(e) => {
            onAdd?.();
            if (isMobile) try { e.currentTarget.blur(); } catch {}
          }}
          aria-label="Добавить практику"
        >
          <IoAdd className={classes.icon} />
        </button>
      </div>
    </div>
  );
}
