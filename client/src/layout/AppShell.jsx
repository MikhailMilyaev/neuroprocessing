import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './AppShell.module.css';
import MobileNav from '../components/MobileNav/MobileNav';
import {
  LOGIN_ROUTE, REGISTRATION_ROUTE, RESET_ROUTE,
  EDUCATION_BASICS_PATH, EDUCATION_THEORY_PATH,
  CHECKEMAIL_ROUTE, ACTIVATED_ROUTE,
  RESET_SENT_ROUTE, RESET_PASSWORD_ROUTE, RESET_SUCCESS_ROUTE,
  ADMIN_ROUTE,
} from '../utils/consts';
import useIOSNavPin from '../hooks/useIOSNavPin';

import useTrialGate from '../hooks/useTrialGate';
import TrialExpiredModal from '../components/TrialExpiredModal/TrialExpiredModal';
import useTrialWelcome from '../hooks/useTrialWelcome';
import TrialWelcomeModal from '../components/TrialWelcomeModal/TrialWelcomeModal';
import { logout as apiLogout } from '../http/userApi';

export default function AppShell() {
  const { pathname } = useLocation();

  // Публичные экраны, где не надо трогать авторизацию/триал вообще
  const isPublic =
    pathname.startsWith(LOGIN_ROUTE) ||
    pathname.startsWith(REGISTRATION_ROUTE) ||
    pathname.startsWith(RESET_ROUTE) ||
    pathname.startsWith(RESET_SENT_ROUTE) ||
    pathname.startsWith(RESET_PASSWORD_ROUTE) ||
    pathname.startsWith(RESET_SUCCESS_ROUTE) ||
    pathname.startsWith(CHECKEMAIL_ROUTE) ||
    pathname.startsWith(ACTIVATED_ROUTE);

  // админка – тоже не показываем триальные модалки
  const isAdminPage = pathname.startsWith(ADMIN_ROUTE);

  const gate    = useTrialGate(isPublic || isAdminPage);   // ⬅️ передаём disabled
  const welcome = useTrialWelcome(isPublic || isAdminPage); // ⬅️ передаём disabled

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    try { localStorage.removeItem('access'); } catch {}
    window.location.replace('/login');
  };

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width:700px)').matches : false
  );
  useEffect(() => {
    const m = window.matchMedia('(max-width:700px)');
    const onChange = () => setIsMobile(m.matches);
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, []);

  const baseHide =
    pathname.startsWith(LOGIN_ROUTE) ||
    pathname.startsWith(REGISTRATION_ROUTE) ||
    pathname.startsWith(RESET_ROUTE);

  const hideOnStoryMobile    = isMobile && pathname.startsWith('/story/');
  const hideOnBasicsMobile   = isMobile && pathname.startsWith(EDUCATION_BASICS_PATH);
  const hideOnAdvancedMobile = isMobile && pathname.startsWith(EDUCATION_THEORY_PATH);
  const hideNav = baseHide || hideOnStoryMobile || hideOnBasicsMobile || hideOnAdvancedMobile;

  useIOSNavPin();

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>

      {!hideNav && isMobile && (
        <div className={styles.bottomNav} aria-hidden={!isMobile}>
          <MobileNav />
        </div>
      )}

      <div id="modals" />
      <div id="storyMenu" />

      {/* Фуллскрин заслонка — не на публичных/админ роуте */}
      {!isPublic && !isAdminPage && (
        <TrialExpiredModal
          visible={!gate.loading && gate.isExpired}
          endsAtISO={gate.endsAtISO}
          telegramUrl="https://t.me/pinky589"
          onLogout={handleLogout}
        />
      )}

      {!isPublic && !isAdminPage && (
        <TrialWelcomeModal
          open={welcome.open}
          onAcknowledge={() => welcome.acknowledge(welcome.userId, welcome.trialStartedAtISO)}
          days={welcome.days}
          endsAtISO={welcome.endsAtISO}
        />
      )}
    </div>
  );
}
