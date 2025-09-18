import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import { BsQuestionCircleFill } from "react-icons/bs";
import classes from "./SettingsModal.module.css";

const ProfileModal = ({
  open,
  position,            
  onClose,
  onLogout,
  onHelp,                
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const handleClickOutside = (e) => {
      if (e.target === el) onClose?.();
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    if (open) {
      el.addEventListener("click", handleClickOutside);
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      el.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const top = typeof position?.y === "number" ? `${position.y}px` : position?.y;
  const left = typeof position?.x === "number" ? `${position.x}px` : position?.x;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classes.dialog}
      style={{ top, left }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Меню профиля"
    >
      <div className={classes.menu} role="menu">
        <button
          type="button"
          className={classes.item}
          onClick={onHelp ?? (() => window.open("https://t.me/pinky589", "_blank"))}
          role="menuitem"
        >
          <BsQuestionCircleFill className={classes.icon} />
          <span className={classes.label}>Контакты</span>
        </button>

        <div className={classes.hr} />

        <button
          type="button"
          className={classes.item}
          onClick={onLogout}
          role="menuitem"
        >
          <IoLogOutOutline className={classes.icon} />
          <span className={classes.label}>Выйти</span>
        </button>
      </div>
    </dialog>,
    document.getElementById("profileModal")
  );
};

export default ProfileModal;
