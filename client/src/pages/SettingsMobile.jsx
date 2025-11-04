import { useContext, useEffect, useRef } from "react";
import { Context } from "../utils/context";
import SettingsList from "../components/Settings/SettingsList";
import styles from "./SettingsMobile.module.css";

export default function SettingsMobile() {
  const { user } = useContext(Context);

  const headerRef = useRef(null);

  // меряем высоту хедера — как в Stories
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--settings-header-h", `${h}px`);
    };
    setH();
    const ro = "ResizeObserver" in window ? new ResizeObserver(setH) : null;
    ro?.observe(el);
    window.addEventListener("resize", setH);
    window.addEventListener("orientationchange", setH);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", setH);
      window.removeEventListener("orientationchange", setH);
    };
  }, []);

  // на мобилке блокируем скролл документа, скролл только внутри .content
  useEffect(() => {
    if (!window.matchMedia("(max-width:700px)").matches) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div className={styles.viewport}>
      <header ref={headerRef} className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
      </header>

      <main className={styles.content}>
        <SettingsList onLogout={() => user.logout()} tgUrl="https://t.me/pinky589" />
      </main>
    </div>
  );
}
