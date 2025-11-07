import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import { FcIdea } from "react-icons/fc";
import classes from "./PracticeHeader.module.css";
import { IDEA_DRAFTS_ROUTE } from "../../../utils/consts";

const titleBySlug = (slug) =>
  slug === "good-bad" ? "Хорошо — Плохо" : String(slug || "").trim();

export default function PracticeRunHeader({
  practiceSlug = "good-bad",
  ideaText = "",
  onOpenSidebar = () => {},
  isSidebarOpen = false,
}) {
  const navigate = useNavigate();
  // было: `Практика · ${titleBySlug(practiceSlug)}`
  const title = useMemo(() => titleBySlug(practiceSlug), [practiceSlug]);
  const idea = (ideaText || "").trim();

  return (
    <div className={classes.header} role="banner" data-lock-scroll="true">
      {/* левая зона: бургер (прячем, когда сайдбар открыт) */}
      <div className={classes.left}>
        {!isSidebarOpen && (
          <button
            type="button"
            className={classes.iconBtn}
            aria-label="Открыть меню"
            onClick={onOpenSidebar}
          >
            <IoMenuOutline className={classes.icon} />
          </button>
        )}
      </div>

      {/* контент: две строки — заголовок и идея */}
      <div className={classes.center}>
        <div className={classes.title} title={title}>{title}</div>
        <div className={classes.subtitle} title={idea || "—"}>
          {idea || "—"}
        </div>
      </div>

      {/* правая зона: лампочка */}
      <div className={classes.right}>
        <button
          type="button"
          className={`${classes.iconBtn} ${classes.lampBtn}`}
          aria-label="Идеи"
          onClick={() => navigate(IDEA_DRAFTS_ROUTE)}
          title="Идеи"
        >
          <FcIdea className={classes.ideaIcon} />
        </button>
      </div>
    </div>
  );
}
