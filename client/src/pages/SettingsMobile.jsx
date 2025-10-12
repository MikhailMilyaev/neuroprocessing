import { useContext, useEffect, useRef } from "react";
import { Context } from "../context";
import SettingsList from "../components/Settings/SettingsList";
import styles from "./SettingsMobile.module.css";
import { useState } from "react";
import { getMe } from "../http/userApi";

export default function SettingsMobile() {
  const { user } = useContext(Context);

  const headerRef = useRef(null);
  const [info, setInfo] = useState({
    status: null,
    trialEndsAt: null,
    subscriptionEndsAt: null,
  });

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (!alive) return;
        setInfo({
          status: me?.user?.subscriptionStatus || null,
          trialEndsAt: me?.user?.trialEndsAt || null,
          subscriptionEndsAt: me?.user?.subscriptionEndsAt || null,
        });
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className={styles.viewport}>
      <header ref={headerRef} className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
      </header>

      <main className={styles.content}>

         {info.status !== 'active' && (
          <div className={styles.trialCard} role="note" aria-label="Информация о пробном доступе">
            <div className={styles.trialTitle}>Пробный доступ</div>
            <div className={styles.trialText}>
              {info.trialEndsAt
                ? <>Открыт до:&nbsp;<b>{new Date(info.trialEndsAt).toLocaleString()}</b></>
                : <>Истёк</>}
            </div>
          </div>
        )}

        {info.status === 'active' && (
    <div className={styles.subCard} role="note" aria-label="Информация о подписке">
      <div className={styles.subTitle}>Подписка</div>
      <div className={styles.subText}>
        Открыто до:&nbsp;<b>{info.subscriptionEndsAt ? new Date(info.subscriptionEndsAt).toLocaleString() : '—'}</b>
      </div>
    </div>
  )}
        <SettingsList onLogout={() => user.logout()} tgUrl="https://t.me/pinky589" />
      </main>
    </div>
  );
}
