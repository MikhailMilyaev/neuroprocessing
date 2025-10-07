import { useMemo, useState, useEffect } from "react";
import StoryCard from "./StoryCard/StoryCard";
import StoryModal from "./StoryModal/StoryModal";
import Spinner from "../../Spinner/Spinner";
import useDelayedVisible from "../../../hooks/useDelayedVisible";
import EmptyState from "../EmptyState/EmptyState";
import classes from "./StoriesList.module.css";

const getTs = (s) => {
  const v = s?.updatedAt ?? s?.updated_at ?? s?.createdAt ?? s?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a, b) => getTs(b) - getTs(a));

export default function StoriesList({
  searchInput,
  storiesList,
  isLoading,
  onDeleteStory,
  showArchive = false,
  onAddStory,
  onToggleArchive,
  closeKey = 0
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const showSpinner = useDelayedVisible(isLoading && (storiesList?.length ?? 0) === 0, 200);

  const q = (searchInput || "").trim().toLocaleLowerCase("ru-RU");

  const activeStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => !s.archive);
    const filtered = q ? base.filter((s) => (s.title ?? "").toLocaleLowerCase("ru-RU").includes(q)) : base;
    return sortByUpdated(filtered);
  }, [storiesList, q]);

  const archiveStories = useMemo(() => {
    const base = (storiesList || []).filter((s) => s.archive);
    const filtered = q ? base.filter((s) => (s.title ?? "").toLocaleLowerCase("ru-RU").includes(q)) : base;
    return sortByUpdated(filtered);
  }, [storiesList, q]);

  const isMobile = () => window.matchMedia("(max-width:700px)").matches;

  const handleContextMenu = (event, id) => {
    if (isMobile()) { event.preventDefault(); return; }   // на мобиле — свайп, без модалки
    event.preventDefault();
    setSelectedId(id);
    setIsModalOpen(true);
    setModalPosition({ x: event.clientX, y: event.clientY });
  };

  const handleDeleteClick = async () => {
    if (selectedId == null) return;
    await onDeleteStory(selectedId);
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const listToRender = showArchive ? archiveStories : activeStories;
  const isEmpty = listToRender.length === 0;

  return (
    <>
      {showSpinner ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 70 }}>
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {isEmpty ? (
            <EmptyState
              variant={showArchive ? "archive" : "active"}
              title={showArchive ? "В архиве пусто" : "Историй пока нет"}
              subtitle={
                showArchive
                  ? "Архивируйте историю, если все идеи имеют нулевой психоэмоциональный заряд."
                  : archiveStories.length > 0
                    ? "Создайте новую или откройте архив, чтобы вернуть историю."
                    : "Нажмите «Добавить», чтобы создать историю."
              }
              ctaLabel={!showArchive ? "Добавить историю" : undefined}
              onCtaClick={!showArchive ? onAddStory : undefined}
              secondaryCtaLabel={showArchive ? "К историям" : (archiveStories.length > 0 ? "Открыть архив" : undefined)}
              onSecondaryClick={() => onToggleArchive?.(!showArchive)}
            />
          ) : (
            <div className={classes.listWrap}>
              {listToRender.map((s) => (
                <StoryCard
                  key={s.id}
                  {...s}
                  isHighlighted={isModalOpen && selectedId === s.id}
                  onContextMenu={(e) => handleContextMenu(e, s.id)}
                  onDelete={onDeleteStory}
                  closeKey={closeKey}
                />
              ))}
            </div>
          )}

          {isModalOpen && (
            <StoryModal
              open={isModalOpen}
              position={modalPosition}
              onDelete={handleDeleteClick}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}
