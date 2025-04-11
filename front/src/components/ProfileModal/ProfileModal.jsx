import { createPortal } from "react-dom"
import { useEffect, useRef } from "react"
import classes from './ProfileModal.module.css'

const ProfileModal = ({ open, position, onClick, onClose }) => {
  const profileModalRef = useRef(null)
  useEffect(() => {
    const modal = profileModalRef.current;
  
    if (!modal) return;
  
    if (open) {
      modal.style.top = `${position.y}px`;
      modal.style.left = `${position.x}px`;
  
      if (!modal.open) {
        modal.showModal();
      }
    } else {
      if (modal.open) {
        modal.close();
      }
    }
  }, [open, position]);

  return createPortal(
    <dialog ref={profileModalRef} className={classes.profileModal}>
        <ul>
            <li>Профиль</li>
            <li>Профиль</li>
            <li>Профиль</li>
        </ul>
    </dialog>,
    document.getElementById("profileModal")
  )
}

export default ProfileModal