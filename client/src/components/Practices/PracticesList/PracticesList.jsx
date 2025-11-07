import { useMemo, useState } from "react";
import PracticeCard from "./PracticeCard/PracticeCard";
import PracticeModal from "./PracticeCard/PracticeModal/PracticeModal";
import classes from "./PracticesList.module.css";

const getTs = (r) => {
  const v = r?.updatedAt ?? r?.updated_at ?? r?.createdAt ?? r?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a,b)=> getTs(b)-getTs(a));

const isMobileDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width:700px)").matches &&
  window.matchMedia("(hover: none)").matches &&
  window.matchMedia("(pointer: coarse)").matches;

const formatEditedAt = (raw) => {
  const d = raw ? new Date(raw) : null;
  if (!d) return "";
  const n = new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const y = new Date(t); y.setDate(t.getDate()-1);
  if (d >= t) return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  if (d >= y && d < t) return "Вчера";
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
};

const titleBySlug = (slug) => (slug === "good-bad" ? "Хорошо — Плохо" : String(slug||"").trim());

export default function PracticesList({
  runs = [],
  onDeleteRun,    // (id) => Promise
  onOpenRun       // (run) => void
}) {
  const list = useMemo(() => sortByUpdated(runs || []), [runs]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [overlayMeta, setOverlayMeta] = useState(null); // {title, time, idea}

  const openMenuAt = (event, id) => {
    if (isMobileDevice()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedId(id);
    setIsMobileMode(false);
    setIsModalOpen(true);
    setAnchorRect(null);
    setModalPos({ x: rect.right, y: rect.top + rect.height });
    setOverlayMeta(null);
  };

  const openMenuMobile = (id, rect) => {
    if (!isMobileDevice()) return;
    const r = list.find((x)=> String(x.id)===String(id));
    const rawTs = r?.updatedAt ?? r?.updated_at ?? r?.createdAt ?? r?.created_at;
    setSelectedId(id);
    setIsMobileMode(true);
    setIsModalOpen(true);
    setAnchorRect(rect || null);
    setOverlayMeta({
      title: titleBySlug(r?.practiceSlug),
      time: formatEditedAt(rawTs),
      idea: r?.ideaText || "—"
    });
  };

  const handleDelete = async () => {
    if (selectedId == null) return;
    await onDeleteRun?.(selectedId, anchorRect || null);
    setIsModalOpen(false);
    setSelectedId(null);
    setAnchorRect(null);
    setOverlayMeta(null);
  };

  return (
    <>
      {list.length === 0 ? (
        <div className={classes.empty}>Запусков пока нет.</div>
      ) : (
        <div className={classes.listWrap} role="region" aria-label="Список практик">
          {list.map((r) => {
            const mobileSelected = isMobileMode && isModalOpen && selectedId === r.id;
            return (
              <PracticeCard
                key={r.id}
                run={r}
                onOpen={()=> onOpenRun?.(r)}
                onOpenMenu={(ev)=> openMenuAt(ev, r.id)}
                onLongPressMobile={(id, rect)=> openMenuMobile(id, rect)}
                mobileContextActive={mobileSelected}
                menuPinned={isModalOpen && selectedId === r.id && !isMobileMode}
              />
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <PracticeModal
          open={isModalOpen}
          position={modalPos}
          onClose={()=>{
            setIsModalOpen(false);
            setAnchorRect(null);
            setOverlayMeta(null);
          }}
          onDelete={handleDelete}
          mobile={isMobileMode}
          anchorRect={anchorRect}
          overlayMeta={overlayMeta}
        />
      )}
    </>
  );
}
