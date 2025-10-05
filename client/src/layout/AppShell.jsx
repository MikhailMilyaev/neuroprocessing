import { Outlet, useLocation } from 'react-router-dom';
import styles from './AppShell.module.css';
import MobileNav from '../components/MobileNav/MobileNav';
import { LOGIN_ROUTE, REGISTRATION_ROUTE, RESET_ROUTE } from '../utils/consts';
import useIOSNavPin from '../hooks/useIOSNavPin';

export default function AppShell() {
  useIOSNavPin();
  const { pathname } = useLocation();
  const hideNav =
    pathname.startsWith(LOGIN_ROUTE) ||
    pathname.startsWith(REGISTRATION_ROUTE) ||
    pathname.startsWith(RESET_ROUTE);

  return (
    <div className={styles.shell}>
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
