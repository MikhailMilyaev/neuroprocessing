// src/pages/Practices/Practices.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { listRuns, createRunIfNeeded, deleteRun } from "../../http/practiceRunsApi";
import { PRACTICES_ROUTE } from "../../utils/consts";

import PracticesList from "../../components/Practices/PracticesList/PracticesList";
import AddIdeaModal from "../../components/Practices/AddIdeaModal/AddIdeaModal";
import RunActionsModal from "../../components/Practices/RunActionsModal/RunActionsModal";

import styles from "./Practices.module.css";
import BackBtn from "../../components/BackBtn/BackBtn";

// realtime
import { startRealtime, subscribe, getActorChannel } from "../../utils/realtime";

export default function Practices() {
  const navigate = useNavigate();

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [actionsFor, setActionsFor] = useState(null);

  const hasRuns = useMemo(() => runs.length > 0, [runs]);

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

  const refresh = useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);
      const data = await listRuns();
      setRuns(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Не удалось загрузить практики");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // 🔌 Realtime: обновляем список на событиях practice_runs.*
  useEffect(() => {
    startRealtime();
    const ch = getActorChannel();
    if (!ch) return;

    let timer = null;
    const onMsg = (msg) => {
      const t = msg?.type || "";
      if (t.startsWith("practice_runs.")) {
        // небольшой дебаунс, чтобы не спамить API при пачке событий
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => { refresh(); }, 150);
      }
    };

    const unsub = subscribe(ch, onMsg);
    return () => {
      unsub?.();
      if (timer) clearTimeout(timer);
    };
  }, [refresh]);

  const handleCreateRun = useCallback(async (ideaText) => {
    try {
      const run = await createRunIfNeeded("good-bad", ideaText);
      await refresh();
      navigate(`${PRACTICES_ROUTE}/${run.practiceSlug}/${run.ideaSlug}`);
    } catch (e) {
      setErr(e.message || "Не удалось создать запуск");
    }
  }, [navigate, refresh]);

  const handleDeleteRun = useCallback(async () => {
    if (!actionsFor) return;
    try {
      await deleteRun(actionsFor.id);
      setActionsFor(null);
      await refresh();
    } catch (e) {
      setErr(e.message || "Не удалось удалить");
    }
  }, [actionsFor, refresh]);

  return (
    <>
      <BackBtn preferFallback />
      <div className={styles.viewport}>
        <header ref={headerRef} className={styles.header}>
          <div className={styles.wrap}>
            <div className={styles.headerBar}>
              <h1 className={styles.title}>Практики</h1>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setAddOpen(true)}
                disabled={loading}
              >
                Добавить
              </button>
            </div>
            {err && (
              <div style={{ color: "#b91c1c", fontSize: 13, padding: "4px 0" }}>
                {err}
              </div>
            )}
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.wrap}>
            {loading ? (
              <div className={styles.empty}><p>Загрузка…</p></div>
            ) : !hasRuns ? (
              <div className={styles.empty}>
                <p>Запусков пока нет. Откройте любую идею и нажмите «Запустить».</p>
              </div>
            ) : (
              <PracticesList
                runs={runs}
                onOpen={(r) => navigate(`${PRACTICES_ROUTE}/${r.practiceSlug}/${r.ideaSlug}`)}
                onOpenActions={(r) => setActionsFor(r)}
              />
            )}

            <div className={styles.bottomPad} />
          </div>
        </main>

        <AddIdeaModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSubmit={handleCreateRun}
        />

        <RunActionsModal
          open={!!actionsFor}
          run={actionsFor}
          onClose={() => setActionsFor(null)}
          onDelete={handleDeleteRun}
        />
      </div>
    </>
  );
}
