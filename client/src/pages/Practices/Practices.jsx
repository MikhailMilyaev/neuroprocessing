import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { listRuns, createRunIfNeeded, deleteRun } from "../../http/practiceRunsApi";
import { PRACTICES_ROUTE } from "../../utils/consts";

import PracticesList from "../../components/Practices/PracticesList/PracticesList";
import AddIdeaModal from "../../components/Practices/PracticesHeader/AddIdeaModal/AddIdeaModal";
import PracticesHeader from "../../components/Practices/PracticesHeader/PracticesHeader";
import EmptyState from "../../components/Practices/EmptyState/EmptyState";
import BlockLoader from "../../components/BlockLoader/BlockLoader";

import styles from "./Practices.module.css";

import { startRealtime, subscribe, getActorChannel } from "../../utils/realtime";
import {
  readPracticeRunsIndex,
  writePracticeRunsIndex,
  removeFromPracticeRunsIndex,
} from "../../utils/cache/practiceRunsCache";
import { useSmartDelay } from "../../hooks/useSmartDelay";

export default function Practices() {
  const navigate = useNavigate();
  const { onOpenSidebar, isSidebarOpen } =
    (typeof useOutletContext === "function" ? useOutletContext() || {} : {}) || {
      onOpenSidebar: () => {},
      isSidebarOpen: false,
    };

  const [runs, setRuns] = useState(() => readPracticeRunsIndex());
  const [loading, setLoading] = useState(() => readPracticeRunsIndex().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const hasRuns = useMemo(() => runs.length > 0, [runs]);
  const isEmpty = useMemo(() => !loading && !hasRuns, [loading, hasRuns]);

  const showBlockLoader = useSmartDelay(refreshing, {
    delayIn: 150,
    minVisible: 400,
  });

  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--practices-header-h", `${h}px`);
    };
    setH();
    const ro = "ResizeObserver" in window ? new ResizeObserver(setH) : null;
    ro?.observe(el);
    window.addEventListener("resize", setH);
    window.addEventListener("orientationchange", setH);
    return () => {
      ro?.disconnect?.();
      window.removeEventListener("resize", setH);
      window.removeEventListener("orientationchange", setH);
    };
  }, []);

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

  const refresh = useCallback(
    async ({ initial = false } = {}) => {
      try {
        setErr(null);

        const hasCache = initial ? readPracticeRunsIndex().length > 0 : true;

        if (initial && !hasCache) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data = await listRuns();
        const arr = Array.isArray(data) ? data : [];
        setRuns(arr);
        writePracticeRunsIndex(arr);
      } catch (e) {
        setErr(e?.message || "Не удалось загрузить практики");
        if (initial && runs.length === 0) {
          const cached = readPracticeRunsIndex();
          setRuns(cached);
        }
      } finally {
        if (initial) setLoading(false);
        setRefreshing(false);
      }
    },
    [runs.length]
  );

  useEffect(() => {
    refresh({ initial: true });
  }, [refresh]);

  useEffect(() => {
    startRealtime();
    const ch = getActorChannel();
    if (!ch) return;
    let timer = null;
    const onMsg = (msg) => {
      const t = msg?.type || "";
      if (t.startsWith("practice_runs.")) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          refresh();
        }, 150);
      }
    };
    const unsub = subscribe(ch, onMsg);
    return () => {
      unsub?.();
      if (timer) clearTimeout(timer);
    };
  }, [refresh]);

  const handleCreateRun = useCallback(
    async (ideaText) => {
      try {
        setErr(null);
        setRefreshing(true);
        const run = await createRunIfNeeded("good-bad", ideaText);
        await refresh();
        navigate(`${PRACTICES_ROUTE}/${run.practiceSlug}/${run.ideaSlug}`);
      } catch (e) {
        setErr(e?.message || "Не удалось создать запуск");
      } finally {
        setRefreshing(false);
      }
    },
    [navigate, refresh]
  );

  const handleDeleteRun = useCallback(
    async (id) => {
      try {
        setErr(null);

        setRuns((prev) => {
          const next = prev.filter((r) => Number(r.id) !== Number(id));
          writePracticeRunsIndex(next);
          return next;
        });
        removeFromPracticeRunsIndex(id);

        setRefreshing(true);
        await deleteRun(id);
        await refresh();
      } catch (e) {
        setErr(e?.message || "Не удалось удалить");
        refresh();
      } finally {
        setRefreshing(false);
      }
    },
    [refresh]
  );

  return (
    <div className={styles.viewport}>
      <BlockLoader show={showBlockLoader} />

      <header ref={headerRef} className={styles.headerSticky} data-lock-scroll="true">
        <PracticesHeader
          onAdd={() => setAddOpen(true)}
          onOpenSidebar={onOpenSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        {err && <div className={styles.errline}>{err}</div>}
      </header>

      <main className={`${styles.content} ${isEmpty ? styles.contentEmpty : ""}`}>
        <div className={`${styles.wrap} ${isEmpty ? styles.wrapEmpty : ""}`}>
          {loading && !hasRuns ? (
            <div className={styles.empty}>
              <p>Загрузка…</p>
            </div>
          ) : !hasRuns ? (
            <div className={styles.emptyContainer}>
              <EmptyState
                title="Пока нет запущенных практик"
                subtitle="Создайте первую практику — выберите шаблон и начните."
                ctaLabel="Добавить практику"
                onCtaClick={() => setAddOpen(true)}
              />
            </div>
          ) : (
            <PracticesList
              runs={runs}
              onOpenRun={(r) =>
                navigate(`${PRACTICES_ROUTE}/${r.practiceSlug}/${r.ideaSlug}`)
              }
              onDeleteRun={handleDeleteRun}
              onAdd={() => setAddOpen(true)}
            />
          )}

          {hasRuns && <div className={styles.bottomPad} />}
        </div>
      </main>

      <AddIdeaModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreateRun}
      />
    </div>
  );
}
