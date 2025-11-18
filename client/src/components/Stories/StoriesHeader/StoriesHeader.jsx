import { useEffect, useRef, useCallback } from "react";
import { IoMenuOutline } from "react-icons/io5";
import { PiNotePencil } from "react-icons/pi";
import Tabs from "./Tabs/Tabs";
import classes from "./StoriesHeader.module.css";

export default function StoriesHeader({
  showArchive = false,
  onToggleArchive = () => {},
  onAddStory = () => {},
  onOpenSidebar = () => {},
  isSidebarOpen = false,
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  // === iOS keyboard keeper (глобальный для хедера) ===
  const keeperRef = useRef(null);

  const removeKeeper = useCallback(() => {
    const el = keeperRef.current;
    keeperRef.current = null;
    if (!el) return;
    try { el.remove(); } catch {}
  }, []);

  useEffect(() => {
    const onFocused = () => removeKeeper();
    document.addEventListener("stories:mobile-input-focused", onFocused);
    return () => document.removeEventListener("stories:mobile-input-focused", onFocused);
  }, [removeKeeper]);

  const armKeyboardKeeper = useCallback(() => {
    if (!isMobile) return;
    if (document.getElementById("stories-keyboard-keeper")) return;

    try {
      const el = document.createElement("input");
      el.type = "text";
      el.id = "stories-keyboard-keeper";
      el.setAttribute("aria-hidden", "true");
      el.style.position = "fixed";
      el.style.top = "calc(env(safe-area-inset-top, 0px) + 6px)";
      el.style.left = "6px";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.opacity = "0.01";
      el.style.background = "transparent";
      el.style.border = "none";
      el.style.padding = "0";
      el.style.margin = "0";
      el.style.zIndex = "2147483647";
      el.style.webkitUserSelect = "text";

      document.body.appendChild(el);
      el.focus();
      try { el.setSelectionRange(1, 1); } catch {}
      try { el.click(); } catch {}

      keeperRef.current = el;
    } catch {}
  }, [isMobile]);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isMobile) {
        armKeyboardKeeper();
        const p = onAddStory("", { inline: true }); // мобилка — через оверлей
        if (p?.then) { try { await p; } catch {} }
        setTimeout(removeKeeper, 2000);
      } else {
        // десктоп — просим список вставить draft вверху
        document.dispatchEvent(new Event("stories:begin-create-draft"));
      }
    } catch (err) {
      console.error("Create story failed:", err);
      removeKeeper();
    }
  };

  const burgerProps = {};
  if (!isMobile) {
    burgerProps["aria-hidden"] = isSidebarOpen;
    burgerProps["disabled"] = isSidebarOpen;
    burgerProps["tabIndex"] = isSidebarOpen ? -1 : 0;
  }

  return (
    <div className={`${classes.header} ${classes.headerPaddedMobile} ${isSidebarOpen ? classes.sidebarOpen : ""}`}>
      <div className={classes.left}>
        <button
          type="button"
          className={classes.burger}
          onClick={(e) => {
            onOpenSidebar?.();
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

        <div className={classes.tabsWrap}>
          <Tabs showArchive={showArchive} onToggleArchive={onToggleArchive} />
        </div>
      </div>

      <div className={classes.right}>
        <div className={classes.toolbar} role="toolbar" aria-label="Действия">
          <button
            type="button"
            className={`${classes.tbtn} ${classes.tbtnBlack}`}
            onClick={handleAdd}
            onContextMenu={(e)=>e.preventDefault()}
            aria-label="Добавить историю"
            title="Добавить историю"
          >
            <PiNotePencil className={classes.icon} />
          </button>
        </div>
      </div>
    </div>
  );
}
