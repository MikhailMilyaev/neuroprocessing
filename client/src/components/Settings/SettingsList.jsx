import { IoLogOutOutline, IoPaperPlaneOutline } from "react-icons/io5";
import styles from "./SettingsList.module.css";

export default function SettingsList({ onLogout, tgUrl = "https://t.me/pinky589" }) {
  return (
    <div className={styles.list}>
      <a
        className={styles.card}
        href={tgUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className={styles.iconWrap}><IoPaperPlaneOutline className={styles.icon} /></div>
        <div className={styles.content}>
          <div className={styles.title}>Контакты</div>
          <div className={styles.subtitle}>Связаться в Telegram</div>
        </div>
      </a>

      <button className={styles.card} type="button" onClick={onLogout}>
        <div className={styles.iconWrap}><IoLogOutOutline className={styles.icon} /></div>
        <div className={styles.content}>
          <div className={styles.title}>Выйти</div>
          <div className={styles.subtitle}>Завершить сеанс</div>
        </div>
      </button>
    </div>
  );
}
