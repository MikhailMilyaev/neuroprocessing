import { useContext, useMemo, useRef, useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import { LuNotebookText } from "react-icons/lu";
import { IoBook } from "react-icons/io5";
import { FcIdea } from "react-icons/fc";
import { FaPlay } from "react-icons/fa";
import styles from "./Sidebar.module.css";
import {
  STORIES_ROUTE,
  STORY_ROUTE,
  PRACTICES_ROUTE,
  EDUCATION_ROUTE,
  IDEA_DRAFTS_ROUTE,
} from "../../utils/consts";
import Settings from "../Settings/Settings";
import { Context } from "../../utils/context";
import { readStoriesIndex } from "../../utils/cache/storiesCache";
import { startRealtime, subscribe, getActorChannel } from "../../utils/realtime";

const navItems = [
  { to: STORIES_ROUTE, label: "Истории", Icon: LuNotebookText },
  { to: IDEA_DRAFTS_ROUTE, label: "Идеи", Icon: FcIdea },
  { to: PRACTICES_ROUTE, label: "Практики", Icon: FaPlay },
  { to: EDUCATION_ROUTE, label: "Обучение", Icon: IoBook },
];

const getTs = (s) => {
  const v = s?.updatedAt ?? s?.updated_at ?? s?.createdAt ?? s?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a, b) => getTs(b) - getTs(a));

const uniqById = (arr = []) => {
  const seen = new Set();
  const out = [];
  for (const s of arr) {
    const k = String(s?.id);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
};

const ACTIVE_KEY = "stories_active_highlight";

export default function Sidebar({
  collapsed,
  onToggle,
  onNavigate = () => {},
  mobile = false,
}) {
  const { user } = useContext(Context);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ x: 0, y: 0, width: 0 });
  const settingsBtnRef = useRef(null);

  const openSettings = () => {
    const btn = settingsBtnRef.current;
    setSettingsOpen(true);
    if (btn?.getBoundingClientRect) {
      requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        setSettingsPos({ x: r.left, y: r.top, width: r.width });
      });
    }
  };

  const { pathname = "" } = useLocation();
  const isStoryDetail = pathname.startsWith(`${STORY_ROUTE}/`);

  const activeSegment = useMemo(() => {
    if (!isStoryDetail) return null;
    const prefix = `${STORY_ROUTE}/`;
    const rest = pathname.slice(prefix.length);
    return rest.split("/")[0] || null;
  }, [pathname, isStoryDetail]);

  const [idxVer, setIdxVer] = useState(0);
  const [activeId, setActiveId] = useState(() => {
    const fromSS = Number.parseInt(sessionStorage.getItem(ACTIVE_KEY) || "", 10);
    return Number.isFinite(fromSS) ? fromSS : null;
  });

  useEffect(() => {
    if (!isStoryDetail) return;
    let cand = null;

    if (activeSegment && /^\d+$/.test(activeSegment)) {
      cand = Number(activeSegment);
    }

    if (!cand && activeSegment) {
      const idx = readStoriesIndex() || [];
      const found = idx.find((s) => s.slug === activeSegment);
      if (found?.id != null) cand = Number(found.id);
    }

    if (!cand) {
      const fromSS = Number.parseInt(sessionStorage.getItem(ACTIVE_KEY) || "", 10);
      if (Number.isFinite(fromSS)) cand = fromSS;
    }

    if (Number.isFinite(cand) && cand > 0) {
      if (cand !== activeId) {
        setActiveId(cand);
        try {
          sessionStorage.setItem(ACTIVE_KEY, String(cand));
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSegment, idxVer, isStoryDetail]);

  useEffect(() => {
    startRealtime();
    const ch = getActorChannel();
    if (!ch) return;
    const off = subscribe(ch, (msg) => {
      const t = msg?.type || "";
      if (t === "stories.index.patch" || t.startsWith("inbox.")) {
        setIdxVer((v) => v + 1);
      }
    });
    return () => {
      try {
        off?.();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const onIdx = () => setIdxVer((v) => v + 1);
    window.addEventListener("stories:index:changed", onIdx);
    return () => window.removeEventListener("stories:index:changed", onIdx);
  }, []);

  useEffect(() => {
    const onOpened = (e) => {
      const id = Number(e?.detail?.id);
      if (Number.isFinite(id) && id > 0) {
        setActiveId(id);
        try {
          sessionStorage.setItem(ACTIVE_KEY, String(id));
        } catch {}
      }
    };
    window.addEventListener("story:opened", onOpened);
    return () => window.removeEventListener("story:opened", onOpened);
  }, []);

  const topStories = useMemo(() => {
    const allRaw = (readStoriesIndex() || []).filter((s) => !s.archive);
    const all = uniqById(sortByUpdated(allRaw));
    if (!all.length) return [];
    if (!activeId) return all.slice(0, 5);

    const already = all.find((s) => Number(s.id) === Number(activeId));
    if (already) return all.slice(0, 5);

    const fromAll = (readStoriesIndex() || []).find(
      (s) => Number(s.id) === Number(activeId)
    );
    const merged = fromAll ? uniqById([fromAll, ...all]) : all;
    return merged.slice(0, 5);
  }, [activeId, idxVer]);

  const hostCls = `${styles.sidebar} ${
    mobile ? styles.mobileHost : ""
  } ${collapsed ? styles.collapsed : ""}`;

  const displayName =
    user?.name?.trim?.() ||
    user?.profile?.name?.trim?.() ||
    user?.email?.split?.("@")?.[0] ||
    "Профиль";
  const initial = displayName?.trim?.().charAt(0)?.toUpperCase?.() || "U";

  return (
    <>
      <aside
        className={hostCls}
        aria-hidden={collapsed && !mobile}
        tabIndex={collapsed && !mobile ? -1 : 0}
      >
        <div className={styles.headerSticky}>
          <div className={styles.headerRow}>
            <div className={styles.title}>NEUROPROCESSING</div>
            <button
              className={styles.iconBtn}
              onClick={() => onToggle?.(true)}
              title="Закрыть меню"
              aria-label="Закрыть меню"
            >
              <IoMenuOutline />
            </button>
          </div>
        </div>

        <div className={styles.midScrollArea}>
          <div className={styles.scrollContent}>
            <nav className={styles.nav} aria-label="Навигация">
              {navItems.map(({ to, label, Icon }) => (
                <div key={to} className={styles.navSection}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.active : ""}`
                    }
                    onClick={onNavigate}
                  >
                    <Icon
                      className={`${styles.navIcon} ${
                        to === IDEA_DRAFTS_ROUTE
                          ? styles.lampIcon
                          : to === PRACTICES_ROUTE
                          ? styles.practiceIcon
                          : ""
                      }`}
                      aria-hidden="true"
                    />
                    <span className={styles.navText}>{label}</span>
                  </NavLink>

                  {/* ПОДСПИСОК ИСТОРИЙ: показываем только если есть элементы */}
                  {to === STORIES_ROUTE && topStories.length > 0 && (
                    <ul className={styles.sublist} aria-label="Последние истории">
                      {topStories.map((s) => {
                        const isActive =
                          isStoryDetail &&
                          activeId != null &&
                          Number(s.id) === Number(activeId);
                        const href = `${STORY_ROUTE}/${s.slug || s.id}`;
                        return (
                          <li key={s.id} className={styles.subItem}>
                            <Link
                              to={href}
                              className={`${styles.subLink} ${
                                isActive ? styles.subActive : ""
                              }`}
                              title={s.title || "Без названия"}
                              onClick={onNavigate}
                            >
                              <span
                                className={`${styles.subText} ${
                                  !s.title?.trim() ? styles.placeholder : ""
                                }`}
                              >
                                {s.title?.trim() || "Сформулируйте проблему"}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className={styles.footerSticky}>
          <div className={styles.footerRow}>
            <button
              ref={settingsBtnRef}
              className={styles.userCard}
              onClick={openSettings}
              aria-expanded={settingsOpen}
              title="Профиль и настройки"
            >
              <span className={styles.avatar} aria-hidden="true">
                {initial}
              </span>
              <span className={styles.userName}>{displayName}</span>
            </button>
          </div>
        </div>
      </aside>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        position={settingsPos}
        onLogout={() => {
          user.logout();
          setSettingsOpen(false);
        }}
      />
    </>
  );
}
