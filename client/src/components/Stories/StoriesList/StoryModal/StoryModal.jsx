import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import classes from "./StoryModal.module.css";
import { MdDeleteOutline } from "react-icons/md";

const StoryModal = ({ open, variant = "desktop", position, onClose, onDelete }) => {
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

  useEffect(() => {
    if (variant !== "desktop") return;
    const el = dialogRef.current;
    if (!el || !open) return;

    let x = position?.x ?? 0;
    let y = position?.y ?? 0;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const pad = 8;
    const rect = el.getBoundingClientRect();

    if (x + rect.width > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
    if (y + rect.height > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
    if (x < pad) x = pad;
    if (y < pad) y = pad;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [open, position, variant]);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`${classes.dialog} ${variant === "mobile" ? classes.mobile : classes.desktop}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {variant === "mobile" ? (
        <div className={classes.sheet} role="menu">
          <button className={`${classes.item} ${classes.itemDanger}`} onClick={onDelete} role="menuitem">
            <MdDeleteOutline className={`${classes.icon} ${classes.iconDanger}`} />
            <span className={classes.labelDanger}>Удалить</span>
          </button>
        </div>
      ) : (
        <div className={classes.menu} role="menu">
          <button className={classes.item} onClick={onDelete} role="menuitem">
            <MdDeleteOutline className={classes.icon} />
            <span className={classes.label}>Удалить</span>
          </button>
        </div>
      )}
    </dialog>,
    document.getElementById("storyModal")
  );
};

export default StoryModal;
