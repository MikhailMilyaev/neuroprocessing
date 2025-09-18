import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import classes from './StoryModal.module.css';
import { MdDeleteOutline } from "react-icons/md";

const StoryModal = ({ open, position, onClose, onDelete }) => {
  const dialogRef = useRef(null);

  // открытие/закрытие
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  // клики/escape
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const handleClickOutside = (event) => {
      if (event.target === el) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
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

  // выставляем и "клампим" позицию внутри вьюпорта
  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !open) return;

    // предварительно ставим куда просили
    el.style.left = `${position.x}px`;
    el.style.top  = `${position.y}px`;

    // меряем и при необходимости двигаем внутрь экрана
    const pad = 8;
    const rect = el.getBoundingClientRect();

    let x = position.x;
    let y = position.y;

    if (x + rect.width > window.innerWidth - pad)
      x = window.innerWidth - rect.width - pad;
    if (y + rect.height > window.innerHeight - pad)
      y = window.innerHeight - rect.height - pad;

    if (x < pad) x = pad;
    if (y < pad) y = pad;

    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
  }, [open, position]);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classes.dialog}
      // top/left всё равно задаём инлайном — см. useEffect выше
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={classes.menu} role="menu">
        <button
          className={classes.item}
          onClick={onDelete}
          role="menuitem"
          aria-label="Удалить"
        >
          <MdDeleteOutline className={classes.icon} />
          <span>Удалить</span>
        </button>
      </div>
    </dialog>,
    document.getElementById("storyModal")
  );
};

export default StoryModal;
