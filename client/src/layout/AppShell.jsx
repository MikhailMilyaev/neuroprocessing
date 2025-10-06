import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import styles from './AppShell.module.css';
import MobileNav from '../components/MobileNav/MobileNav';
import { LOGIN_ROUTE, REGISTRATION_ROUTE, RESET_ROUTE } from '../utils/consts';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  return !!(window.navigator.standalone) || window.matchMedia?.('(display-mode: standalone)')?.matches;
}

function useIOSStandaloneFixes() {
  const [appH, setAppH] = useState(null);

  useEffect(() => {
    if (!(isIOS() && isStandalone())) return;

    const update = () => {
      setAppH(window.innerHeight);
      document.documentElement.style.setProperty('--app-inner-h', `${window.innerHeight}px`);
    };
    update();
    document.documentElement.classList.add('pwa-standalone');

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
    const prevBodyOverscroll = document.body.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';

    const lock = (el) => {
      if (!el) return { off: () => {} };
      const wheelBlock = (e) => e.preventDefault();
      const touchBlock = (e) => e.preventDefault();
      el.addEventListener('wheel', wheelBlock, { passive: false });
      el.addEventListener('touchmove', touchBlock, { passive: false });
      el.addEventListener('gesturestart', touchBlock, { passive: false });
      return {
        off: () => {
          el.removeEventListener('wheel', wheelBlock, { passive: false });
          el.removeEventListener('touchmove', touchBlock, { passive: false });
          el.removeEventListener('gesturestart', touchBlock, { passive: false });
        }
      };
    };

    const nav = document.querySelector('nav[aria-label="Основная навигация"]');
    const navLock = lock(nav);

    const lockAllHeaderLike = () => {
      const nodes = Array.from(document.querySelectorAll('[data-lock-scroll="true"]'));
      return nodes.map(lock);
    };
    let headerLocks = lockAllHeaderLike();

    const mo = new MutationObserver(() => {
      headerLocks.forEach((l) => l.off());
      headerLocks = lockAllHeaderLike();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    document.addEventListener('visibilitychange', update);

    return () => {
      document.documentElement.classList.remove('pwa-standalone');
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('visibilitychange', update);
      mo.disconnect();
      headerLocks.forEach((l) => l.off());
      navLock.off();
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll || '';
      document.body.style.overscrollBehaviorY = prevBodyOverscroll || '';
    };
  }, []);

  return appH;
}

export default function AppShell() {
  const { pathname } = useLocation();
  const hideNav =
    pathname.startsWith(LOGIN_ROUTE) ||
    pathname.startsWith(REGISTRATION_ROUTE) ||
    pathname.startsWith(RESET_ROUTE);

  const appH = useIOSStandaloneFixes();

  return (
    <div
      className={styles.shell}
      style={appH ? { height: `${appH}px` } : undefined}
    >
      <main className={styles.main}>
        <Outlet />
      </main>

      {!hideNav && (
        <div className={styles.bottomNav}>
          <MobileNav />
        </div>
      )}
    </div>
  );
}
