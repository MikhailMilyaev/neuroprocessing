import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './Shell.module.css';
import MobileNav from '../components/MobileNav/MobileNav';
import {
  LOGIN_ROUTE, REGISTRATION_ROUTE, RESET_ROUTE,
  educationPath, EDUCATION_SLUGS,
} from '../utils/consts';
import useIOSNavPin from '../hooks/useIOSNavPin';

export default function AppShell() {
  const { pathname } = useLocation();

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
  const hideOnBasicsMobile   = isMobile && pathname.startsWith(educationPath(EDUCATION_SLUGS.BASICS));
  const hideOnAdvancedMobile = isMobile && pathname.startsWith(educationPath(EDUCATION_SLUGS.ADVANCED));
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
    </div>
  );
}
