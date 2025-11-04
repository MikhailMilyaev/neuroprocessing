import { IoLogOutOutline } from "react-icons/io5";
import styles from "./SettingsList.module.css";

export default function SettingsList({ onLogout }) {
  return (
    <div className={styles.list}>
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