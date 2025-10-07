import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import SettingsList from "../components/Settings/SettingsList";
import { Context } from "../context";
import styles from "./SettingsMobile.module.css";

export default function SettingsMobile() {
  const nav = useNavigate();
  const { user } = useContext(Context);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть"
          onClick={() => nav(-1)}
        >
          <IoClose className={styles.closeIcon} />
        </button>
      </header>

      <main className={styles.main}>
        <SettingsList
          onLogout={() => user.logout()}
          tgUrl="https://t.me/pinky589"
        />
      </main>
    </div>
  );
}
