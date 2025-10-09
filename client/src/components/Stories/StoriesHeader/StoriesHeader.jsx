import { useRef, useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoAdd,
  IoSearchOutline,
  IoBulbOutline,
  IoBookOutline,
  IoSettingsOutline
} from "react-icons/io5";

import Tabs from "./Tabs/Tabs";
import SearchStory from "./SearchStory/SearchStory";
import SettingsModal from "./SettingsModal/SettingsModal";

import classes from "./StoriesHeader.module.css";
import { Context } from "../../../context";

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

  const [searchOpen, setSearchOpen] = useState(false);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    if (!hasAnyStories && searchOpen) setSearchOpen(false);
  }, [hasAnyStories, searchOpen]);

  // авто-фокус при открытии поиска (особенно для iOS)
  useEffect(() => {
    if (!searchOpen) return;
    const el = mobileSearchRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true });
        const len = (el.value || "").length;
        el.setSelectionRange(len, len);
      } catch {}
    });
  }, [searchOpen]);

  const openProfile = () => {
    const rect = settingsBtnRef.current?.getBoundingClientRect?.();
    if (rect) setProfilePos({ x: rect.right + 20, y: rect.top });
    setProfileOpen(true);
  };
  const handleLogout = () => { user.logout(); setProfileOpen(false); };
  const handleHelp   = () => window.open("https://t.me/pinky589", "_blank");

  return (
    <div className={`${classes.header} ${classes.headerPaddedMobile} ${searchOpen ? classes.searchMode : ""}`}>
      {!searchOpen && (
        <>
          <div className={classes.left}>
            <Tabs showArchive={showArchive} onToggleArchive={onToggleArchive} />
          </div>

          <div className={classes.center}>
            {hasAnyStories && (
              <div className={`${classes.searchWrap} ${classes.onlyDesktopFlex}`}>
                <SearchStory value={searchInput} onChangeText={setSearchInput} />
              </div>
            )}
          </div>

          <div className={classes.right}>
            <div className={classes.toolbar} role="toolbar" aria-label="Действия">
              <div className={classes.onlyDesktop}>
                <Link
                  to="/ideas"
                  className={classes.tbtn}
                  aria-label="Идеи на обработку"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <IoBulbOutline className={classes.icon} />
                </Link>

                <Link
                  to="/education"
                  className={classes.tbtn}
                  aria-label="Обучение"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <IoBookOutline className={classes.icon} />
                </Link>
              </div>

              <div className={classes.onlyMobileInline}>
                {hasAnyStories && (
                  <button
                    type="button"
                    className={classes.tbtn}
                    aria-label="Поиск"
                    onClick={() => setSearchOpen(true)}
                  >
                    <IoSearchOutline className={classes.icon} />
                  </button>
                )}
              </div>
              

              <button
   type="button"
   className={`${classes.tbtn} ${classes.primary}`}
   onClick={(e) => {
     e.preventDefault();
     e.stopPropagation();
     // важно: НЕ передавать e внутрь!
     // просим инлайн-режим + автофокус
     onAddStory('', { inline: true });
   }}
   aria-label="Добавить историю"
 >
                <IoAdd className={classes.icon} />
                <span className={classes.primaryLabel}>Добавить</span>
              </button>

              <div className={classes.onlyDesktop}>
                <button
                  ref={settingsBtnRef}
                  type="button"
                  className={classes.tbtn}
                  onClick={openProfile}
                  aria-label="Настройки"
                >
                  <IoSettingsOutline className={classes.icon} />
                </button>
              </div>
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
        </>
      )}

      {searchOpen && (
        <div className={classes.searchInline}>
          <div className={classes.searchRowInput}>
            <SearchStory
              value={searchInput}
              onChangeText={setSearchInput}
              inputRef={mobileSearchRef}
              autoFocus
            />
          </div>
          <button
            type="button"
            className={classes.cancelBtn}
            onClick={() => {
              setSearchOpen(false);
              setSearchInput('');
              try { mobileSearchRef.current?.blur(); } catch {}
            }}
          >
            Отменить
          </button>
        </div>
      )}
    </div>
  );
}
