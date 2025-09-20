import classes from "./Tabs.module.css";

export default function Tabs({
  showArchive = false,         
  onToggleArchive = () => {},
}) {
  return (
    <div className={classes.tabs} role="tablist" aria-label="Режим просмотра">
      <button
        type="button"
        role="tab"
        aria-selected={!showArchive}
        className={`${classes.tab} ${!showArchive ? classes.tabActive : ""}`}
        onClick={() => onToggleArchive(false)}
      >
        Активные
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={showArchive}
        className={`${classes.tab} ${showArchive ? classes.tabActive : ""}`}
        onClick={() => onToggleArchive(true)}
      >
        Архив
      </button>
    </div>
  );
}
