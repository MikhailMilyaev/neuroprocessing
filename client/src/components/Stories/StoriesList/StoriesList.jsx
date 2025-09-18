import { useMemo, useState } from "react";
import StoryCard from "./StoryCard/StoryCard";
import StoryModal from "./StoryModal/StoryModal";
import Spinner from "../../Spinner/Spinner";
import useDelayedVisible from "../../../hooks/useDelayedVisible";
import EmptyState from "../EmptyState/EmptyState";

const getTs = (s) => {
  const v = s?.updatedAt ?? s?.updated_at ?? s?.createdAt ?? s?.created_at ?? 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};
const sortByUpdated = (arr) => (arr || []).slice().sort((a, b) => getTs(b) - getTs(a));

const StoriesList = ({
  searchInput,
  storiesList,
  isLoading,
  onDeleteStory,
  showArchive = false,    
  onAddStory,             
  onToggleArchive,      
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const showSpinner = useDelayedVisible(isLoading && (storiesList?.length ?? 0) === 0, 200);

  const q = searchInput.trim().toLocaleLowerCase("ru-RU");

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

  const handleContextMenu = (event, id) => {
    if (!event.target.closest("button")) return;
    event.preventDefault();
    setSelectedId(id);
    setModalPosition({ x: event.clientX, y: event.clientY });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async () => {
    if (selectedId == null) return;
    await onDeleteStory(selectedId);
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  };

  return (
    <>
      {showSpinner ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 70 }}>
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {/* ───── режим АКТИВНЫХ ───── */}
          {!showArchive && (
            <>
            <div style={{ marginTop: "25px"}}></div>
              {activeStories.length === 0 ? (
                <EmptyState
                  variant="active"
                  title="Историй пока нет"
                  subtitle={
                    archiveStories.length > 0
                      ? "Создайте новую или откройте архив, чтобы вернуть историю."
                      : "Нажмите «Добавить», чтобы создать историю."
                  }
                  ctaLabel={onAddStory ? "Добавить историю" : undefined}
                  onCtaClick={onAddStory}
                  secondaryCtaLabel={
                    archiveStories.length > 0 && onToggleArchive ? "Открыть архив" : undefined
                  }
                  onSecondaryClick={() => onToggleArchive?.(true)}
                />
              ) : (
                <>
                  {activeStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      {...story}
                      isHighlighted={isModalOpen && selectedId === story.id}
                      onContextMenu={(e) => handleContextMenu(e, story.id)}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {showArchive && (
            <>
              {archiveStories.length === 0 ? (
                <EmptyState
                  variant="archive"
                  title="В архиве пусто"
                  subtitle="Архивируйте историю, если все идеи имеют нулевой психоэмоциональный заряд."
                  secondaryCtaLabel={onToggleArchive ? "К историям" : undefined}
                  onSecondaryClick={() => onToggleArchive?.(false)}
                />
              ) : (
                <>
                  <div style={{ marginTop: "25px"}}></div>
                  {archiveStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      {...story}
                      isHighlighted={isModalOpen && selectedId === story.id}
                      onContextMenu={(e) => handleContextMenu(e, story.id)}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {isModalOpen && (
            <StoryModal
              open={isModalOpen}
              position={modalPosition}
              onDelete={handleDeleteClick}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}
    </>
  );
};

export default StoriesList;
