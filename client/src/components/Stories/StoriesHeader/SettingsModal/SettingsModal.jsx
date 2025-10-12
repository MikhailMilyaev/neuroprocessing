import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import { BsQuestionCircleFill } from "react-icons/bs";
import classes from "./SettingsModal.module.css";
import { getMe } from "../../../../http/userApi";

const ProfileModal = ({
  open,
  position,      // { x, y } или любые css-значения
  onClose,
  onLogout,
  onHelp,
}) => {
  const dialogRef = useRef(null);
  const [trialInfo, setTrialInfo] = useState({
    endsAt: null,
    status: null,
    subscriptionEndsAt: null,
    loading: true,
  });

  // Открытие/закрытие <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  // Обработчики клика снаружи и Escape
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

  // Подтягиваем trial-инфо при открытии
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (!alive) return;
        setTrialInfo({
          endsAt: me?.user?.trialEndsAt || null,
          status: me?.user?.subscriptionStatus || null,
          subscriptionEndsAt: me?.user?.subscriptionEndsAt || null,
          loading: false,
        });
      } catch {
        if (alive) setTrialInfo((d) => ({ ...d, loading: false }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

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
        {/* Плашка про триал — показываем если не active */}
        {!trialInfo.loading && trialInfo.status !== "active" && (
          <div className={classes.trialBox} role="note" aria-label="Информация о пробном доступе">
            <div className={classes.trialTitle}>Пробный доступ</div>
            <div className={classes.trialText}>
              {trialInfo.endsAt
                ? <>Открыт до: <b>{new Date(trialInfo.endsAt).toLocaleString()}</b></>
                : <>Истёк</>}
            </div>
          </div>
        )}

                {!trialInfo.loading && trialInfo.status === "active" && (
          <div className={classes.subBox} role="note" aria-label="Информация о подписке">
            <div className={classes.subTitle}>Подписка</div>
            <div className={classes.subText}>
              Открыто до: <b>
                {trialInfo.subscriptionEndsAt
                  ? new Date(trialInfo.subscriptionEndsAt).toLocaleString()
                  : '—'}
              </b>
            </div>
          </div>
        )}

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
