import { IoMenuOutline } from "react-icons/io5";
import classes from "./EducaitonListHeader.module.css";

export default function EducationListHeader({
  onOpenSidebar = () => {},
  isSidebarOpen = false,
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width:700px)").matches &&
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  const burgerProps = {};
  if (!isMobile) {
    burgerProps["aria-hidden"] = isSidebarOpen;
    burgerProps["disabled"] = isSidebarOpen;
    burgerProps["tabIndex"] = isSidebarOpen ? -1 : 0;
  }

  return (
    <div
      className={`${classes.header} ${classes.headerPaddedMobile} ${
        isSidebarOpen ? classes.sidebarOpen : ""
      }`}
    >
      <div className={classes.left}>
        <button
          type="button"
          className={classes.burger}
          onClick={(e) => {
            onOpenSidebar?.();
            if (isMobile) {
              try {
                e.currentTarget.blur();
              } catch {}
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              try {
                e.currentTarget.blur();
              } catch {}
            }
          }}
          onMouseLeave={(e) => {
            if (isMobile) {
              try {
                e.currentTarget.blur();
              } catch {}
            }
          }}
          aria-label="Открыть меню"
          title="Меню"
          {...burgerProps}
        >
          <IoMenuOutline className={classes.burgerIcon} />
        </button>
      </div>
    </div>
  );
}
