import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import styles from './Shell.module.css';
import useIOSNavPin from '../hooks/useIOSNavPin';
import Sidebar from '../components/SideBar/SideBar';

export default function AppShell() {
  useLocation();
  useIOSNavPin();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width:700px)').matches
      : false
  );

  useEffect(() => {
    const m = window.matchMedia('(max-width:700px)');
    const onChange = () => setIsMobile(m.matches);
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, []);

  if (isMobile) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const openMobileSidebar = () => setMobileSidebarOpen(true);
    const closeMobileSidebar = () => setMobileSidebarOpen(false);

    const computeDrawerW = () => Math.min(340, Math.round(window.innerWidth * 0.88));
    const [drawerW, setDrawerW] = useState(computeDrawerW());
    useEffect(() => {
      const onR = () => setDrawerW(computeDrawerW());
      window.addEventListener('resize', onR);
      return () => window.removeEventListener('resize', onR);
    }, []);

    const drag = useRef({ startX: 0, dx: 0, active: false });
    const [dragDX, setDragDX] = useState(0);
    const [dragging, setDragging] = useState(false);

    const onTouchStart = (e) => {
      if (!mobileSidebarOpen) return;
      const x = e.touches?.[0]?.clientX ?? 0;
      drag.current = { startX: x, dx: 0, active: true };
      setDragging(true);
    };

    const onTouchMove = (e) => {
      if (!drag.current.active) return;
      const x = e.touches?.[0]?.clientX ?? 0;
      const dx = Math.min(0, x - drag.current.startX);
      drag.current.dx = dx;
      setDragDX(dx);
    };

    const onTouchEnd = () => {
      if (!drag.current.active) return;
      const QUICK_CLOSE_PX = 6;
      const shouldClose = drag.current.dx <= -QUICK_CLOSE_PX;
      drag.current = { startX: 0, dx: 0, active: false };
      setDragDX(0);
      setDragging(false);
      if (shouldClose) closeMobileSidebar();
    };

    let p = mobileSidebarOpen ? 1 : 0;
    if (mobileSidebarOpen && dragging && drawerW) {
      p = Math.max(0, Math.min(1, 1 + dragDX / drawerW));
    }

    const peek = 12;
    const sidebarX = -(1 - p) * drawerW;
    const mainX = p * (drawerW - peek);
    const shadeOpacity = Math.pow(p, 2) * 0.12;

    return (
      <div className={styles.shell}>
        <div className={styles.mobileOnly}>
          <div
            className={styles.mobileShadeVisual}
            style={{
              left: `${mainX}px`,
              opacity: shadeOpacity,
              transition: dragging ? 'none' : undefined,
            }}
          />
          <div
            className={styles.mobileShadeHit}
            onClick={closeMobileSidebar}
            style={{
              left: `${mainX}px`,
              pointerEvents: p > 0 ? 'auto' : 'none',
            }}
          />
          <div
            className={styles.mobileSidebarInner}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              transform: `translateX(${sidebarX}px)`,
              transition: dragging ? 'none' : undefined,
            }}
          >
            <Sidebar
              collapsed={false}
              onToggle={closeMobileSidebar}
              onNavigate={closeMobileSidebar}
              mobile
            />
          </div>
          <main
            className={styles.mainMobile}
            style={{
              transform: `translateX(${mainX}px)`,
              transition: dragging ? 'none' : undefined,
            }}
          >
            <Outlet
              context={{
                onOpenSidebar: openMobileSidebar,
                isSidebarOpen: mobileSidebarOpen,
              }}
            />
          </main>
        </div>
      </div>
    );
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const onOpenSidebar = () => setSidebarCollapsed(false);
  const onCloseSidebar = () => setSidebarCollapsed(true);

  return (
    <div className={styles.shell}>
      <div
        className={[
          styles.layout,
          sidebarCollapsed ? styles.isCollapsed : '',
        ].join(' ')}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => onCloseSidebar()}
          onNavigate={() => {}}
          mobile={false}
        />
        <main className={styles.main}>
          <Outlet
            context={{
              onOpenSidebar,
              isSidebarOpen: !sidebarCollapsed,
            }}
          />
        </main>
      </div>
      <div id="modals" />
      <div id="storyMenu" />
      <div id="settings" />
    </div>
  );
}
