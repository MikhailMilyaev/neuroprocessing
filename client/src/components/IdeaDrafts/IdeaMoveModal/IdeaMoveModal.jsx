import { useEffect, useRef } from 'react';
import classes from './IdeaMoveModal.module.css';

export default function IdeaMoveModal({
  open,
  onClose,
  onMoveTo,
  onCreateStory,
  activeStories = [],
  archivedStories = [],
}) {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hasArchive = archivedStories.length > 0;

  return (
    <div
      ref={backdropRef}
      className={classes.overlay}
      onClick={(e) => { if (e.target === backdropRef.current) onClose?.(); }}
    >
      <div className={classes.modal} role="dialog" aria-modal="true" aria-labelledby="moveTitle">
        <div className={classes.header}>
          <div id="moveTitle" className={classes.title}>Переместить в историю</div>
          <button
            type="button"
            className={classes.iconBtn}
            aria-label="Закрыть"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={classes.section}>
          <div className={classes.sectionTitle}>Активные</div>
          <div className={classes.list}>
            {activeStories.map(s => (
              <button key={s.id} className={classes.storyBtn} onClick={() => onMoveTo?.(s.id)}>
                {s.title || '(без названия)'}
              </button>
            ))}
            {activeStories.length === 0 && <div className={classes.dim}>Не найдено</div>}
          </div>
        </div>

        {hasArchive ? (
          <div className={classes.section}>
            <div className={classes.sectionTitle}>Архив</div>
            <div className={classes.list}>
              {archivedStories.map(s => (
                <button key={s.id} className={classes.storyBtn} onClick={() => onMoveTo?.(s.id)}>
                  {s.title || '(без названия)'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={classes.noArchiveNote}>Архивных историй нет.</div>
        )}

        <div className={classes.footer}>
          <button className={classes.primaryBtn} onClick={onCreateStory}>
            Создать новую историю с этой идеей
          </button>
        </div>
      </div>
    </div>
  );
}
