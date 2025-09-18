import { useRef, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  IoAdd,
  IoBulbOutline,
  IoBookOutline,
  IoSettingsOutline
} from "react-icons/io5";

import Tabs from "./Tabs/Tabs";
import SearchStory from "./SearchStory/SearchStory";
import SettingsModal from "./SettingsModal/SettingsModal";

import classes from "./StoriesHeader.module.css";
import { Context } from "../../../index";

export default function StoriesHeader({
  showArchive = false,
  onToggleArchive = () => {},
  hasAnyStories = true,
  searchInput = "",
  setSearchInput = () => {},
  onAddStory = () => {},
  showReminders,
  onToggleReminders,
}) {
  const { user } = useContext(Context);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePos, setProfilePos] = useState({ x: 0, y: 0 });
  const settingsBtnRef = useRef(null);

  const openProfile = () => {
    const rect = settingsBtnRef.current?.getBoundingClientRect?.();
    if (rect) setProfilePos({ x: rect.right + 20, y: rect.top });
    setProfileOpen(true);
  };
  const handleLogout = () => { user.logout(); setProfileOpen(false); };
  const handleHelp   = () => window.open("https://t.me/pinky589", "_blank");

  return (
    <div className={classes.header}>
      <div className={classes.left}>
        <Tabs showArchive={showArchive} onToggleArchive={onToggleArchive} />
      </div>

      <div className={classes.center}>
        {hasAnyStories && (
          <div className={classes.searchWrap}>
            <SearchStory value={searchInput} onChangeText={setSearchInput} />
          </div>
        )}
      </div>

      <div className={classes.right}>
        <div className={classes.toolbar} role="toolbar" aria-label="Действия">
          <Link
            to="/ideas"
            className={classes.tbtn}
            aria-label="Идеи на обработку"
            data-tooltip="Идеи"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            <IoBulbOutline className={classes.icon} />
          </Link>

          <Link
            to="/education"
            className={classes.tbtn}
            aria-label="Обучение"
            data-tooltip="Обучение"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            <IoBookOutline className={classes.icon} />
          </Link>

          <button
            type="button"
            className={`${classes.tbtn} ${classes.primary}`}
            onClick={onAddStory}
            aria-label="Добавить историю"
          >
            <IoAdd className={classes.icon} />
            <span className={classes.primaryLabel}>Добавить</span>
          </button>

          <button
            ref={settingsBtnRef}
            type="button"
            className={classes.tbtn}
            onClick={openProfile}
            aria-label="Настройки"
            data-tooltip="Настройки"
          >
            <IoSettingsOutline className={classes.icon} />
          </button>
        </div>

        <SettingsModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          position={profilePos}
          onLogout={handleLogout}
          onHelp={handleHelp}
          showArchive={showArchive}
          onToggleArchive={onToggleArchive}
          showReminders={showReminders}
          onToggleReminders={onToggleReminders}
        />
      </div>
    </div>
  );
}
