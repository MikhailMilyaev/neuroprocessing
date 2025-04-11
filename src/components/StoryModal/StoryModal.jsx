import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

const StoryModal = ({ open, position, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dialogRef.current && event.target === dialogRef.current) {
        onClose();
      }
    };

    if (open) {
      dialogRef.current.addEventListener("click", handleClickOutside);
    }

    return () => {
      if (dialogRef.current) {
        dialogRef.current.removeEventListener("click", handleClickOutside);
      }
    };
  }, [open, onClose]);

  return createPortal(
    <dialog
      ref={dialogRef}
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        background: "#fff",
        padding: "12px",
        minWidth: "150px",
        border: "none",
        borderRadius: "8px"
      }}/>,
    document.getElementById("storyModal")
  );
};

export default StoryModal;
