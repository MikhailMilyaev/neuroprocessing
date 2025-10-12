import classes from './StoryCard.module.css';
import { useNavigate } from 'react-router-dom';
import { STORY_ROUTE } from '../../../../utils/consts';
import { useMemo, useRef, useState, useEffect } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';

const toDate = (v)=> (v ? new Date(v) : null);
const formatEditedAt = (raw)=>{
  const d = toDate(raw); if(!d) return '';
  const n = new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const y = new Date(t); y.setDate(t.getDate()-1);
  if(d>=t) return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  if(d>=y && d<t) return 'Вчера';
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
};

export default function StoryCard({
  id, slug, title, updatedAt, updated_at, createdAt, created_at,
  isHighlighted, onContextMenu, onDelete,
  closeKey = 0,

  /* инлайн-режимы (получаем сверху) */
  isDraft = false,
  isEditing = false,
  onBeginRename,
  onSubmitTitle,   // (value, id?) =>
  onCancelEdit,    // (id?) =>
}){
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ сырой таймстамп из пропсов
  const rawTs = updatedAt ?? updated_at ?? createdAt ?? created_at;

  const editedLabel = useMemo(() => {
    if (isEditing) return '';
    const src = rawTs ?? new Date(); // <-- fallback на “сейчас”
    return formatEditedAt(src);
  }, [isEditing, rawTs]);

  const hadTitle = !!(title && title.trim().length > 0);
  const isMobile = ()=> window.matchMedia('(max-width:700px)').matches;
  const displayTitle = hadTitle ? title : 'Сформулируйте проблему';
  const targetUrl = `${STORY_ROUTE}/${slug || id}`;

  // локальное состояние для инпута в режиме редактирования
  const [value, setValue] = useState(title || '');

  useEffect(() => {
    if (isEditing) setValue(title || '');
  }, [isEditing, title]);

  // автофокус при входе в режим редактирования
  useEffect(() => {
    if (!isEditing) return;
    let af1 = 0, af2 = 0;
    af1 = requestAnimationFrame(() => {
      af2 = requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        try { el.focus({ preventScroll: true }); } catch { el.focus(); }
        const len = el.value.length;
        try { el.setSelectionRange(len, len); } catch {}
      });
    });
    return () => {
      cancelAnimationFrame(af1);
      cancelAnimationFrame(af2);
    };
  }, [isEditing]);

  const spawnRipple = (clientX, clientY, right=false)=>{
    const el = btnRef.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 1.1;
    const x = (clientX ?? r.left) - r.left - size/2;
    const y = (clientY ?? r.top)  - r.top  - size/2;
    const wave = document.createElement('span');
    wave.className = `${classes.ripple} ${right?classes.rippleRight:classes.rippleLeft}`;
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${x}px`; wave.style.top = `${y}px`;
    el.appendChild(wave);
    wave.addEventListener('animationend', ()=> wave.remove());
  };

  /* свайп-параметры */
  const ACTION_W = 192;
  const SNAP_RATIO = 0.6;
  const VEL_OPEN = -0.35;
  const VEL_CLOSE = 0.35;

  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [draggingActive, setDraggingActive] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const intent = useRef(null);
  const raf = useRef(0);

  useEffect(()=>{
    const onGlobal = (e)=>{
      if (e.detail && e.detail !== id) closeSwipe();
    };
    window.addEventListener('story-swipe-open', onGlobal);
    return ()=> window.removeEventListener('story-swipe-open', onGlobal);
  }, [id]);

  const setOffsetRaf = (val)=>{
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(()=> setOffset(val));
  };

  const openSwipe = ()=>{
    setDraggingActive(false);
    setOffset(-ACTION_W);
    setRevealed(true);
  };
  const closeSwipe = ()=>{
    setDraggingActive(false);
    setOffset(0);
    setRevealed(false);
  };

  const onTouchStart = (e)=>{
    if(!isMobile()) return;
    if (isEditing) return; // во время редактирования свайп не активируем
    dragging.current = true;
    intent.current = null;
    setDraggingActive(false);
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    lastX.current = startX.current;
    lastT.current = performance.now();
    window.dispatchEvent(new CustomEvent('story-swipe-open', { detail: id }));
  };

  const onTouchMove  = (e)=>{
    if(!isMobile() || !dragging.current) return;

    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    const now = performance.now();
    const dx = tx - startX.current;
    const dy = ty - startY.current;

    if (!intent.current) {
      const TH = 6;
      if (Math.abs(dx) > TH || Math.abs(dy) > TH) {
        intent.current = (Math.abs(dx) > Math.abs(dy) * 1.1) ? 'x' : 'y';
        if (intent.current === 'x') setDraggingActive(true);
      }
    }

    if (intent.current === 'y') return;

    if (intent.current === 'x') {
      e.preventDefault();
      const base = revealed ? -ACTION_W : 0;
      const x = Math.max(-ACTION_W, Math.min(0, base + dx));
      setOffsetRaf(x);

      const dt = Math.max(1, now - lastT.current);
      velocity.current = (tx - lastX.current) / dt;
      lastX.current = tx;
      lastT.current = now;
    }
  };

  const finishSwipe = ()=>{
    if(!isMobile()) return;
    dragging.current = false;

    if (intent.current === 'x') {
      setDraggingActive(false);

      if (velocity.current <= VEL_OPEN) { openSwipe(); }
      else if (velocity.current >= VEL_CLOSE) { closeSwipe(); }
      else {
        const openedPart = Math.abs(offset) / ACTION_W;
        if (openedPart >= SNAP_RATIO) openSwipe();
        else closeSwipe();
      }
    }
    intent.current = null;
  };

  const onTouchEnd = finishSwipe;
  const onTouchCancel = finishSwipe;

  useEffect(()=>{ if(revealed || offset!==0){ closeSwipe(); } }, [closeKey]); // eslint-disable-line

  const onRowClick=(e)=>{
    if (isEditing) return;
    if(revealed && isMobile()){ e.preventDefault(); closeSwipe(); return; }
    spawnRipple(e.clientX ?? 0, e.clientY ?? 0, false);
    navigate(targetUrl);
  };

  const onContext=(e)=>{
    if(isMobile()){ e.preventDefault(); return; }
    if (isEditing) return;
    spawnRipple(e.clientX, e.clientY, true);
    onContextMenu?.(e, id);
  };

  // ===== инлайн-редактирование =====
  const commit = ()=>{
    const t = (value ?? '').trim();
    if (!t) {
      if (hadTitle) {
        // раньше заголовок был → НЕ удаляем, сохраняем пустую строку
        onSubmitTitle?.('', id);
        onCancelEdit?.(id);
      } else {
        // новая пустая → удаляем
        onDelete?.(id);
      }
      return;
    }
    onSubmitTitle?.(t, id);
    onCancelEdit?.(id);
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit?.(id);
    }
  };

  const rowRevealed = (revealed || offset < 0);
  const showTime = !isEditing && hadTitle; // <-- всегда показываем, editedLabel сам корректный

  return (
    <div className={`${classes.row} ${rowRevealed ? classes.rowRevealed : ''}`}>
      <div className={classes.actions} aria-hidden={!rowRevealed}>
        <button
          type="button"
          className={`${classes.actionBtn} ${classes.editBtn}`}
          onClick={(ev)=>{ ev.stopPropagation(); onBeginRename?.(id); closeSwipe(); }}
          aria-label="Изменить"
          title="Изменить"
        >
          <MdEdit className={classes.actionIcon}/>
          <span className={classes.actionText}>Изменить</span>
        </button>

        <button
          type="button"
          className={`${classes.actionBtn} ${classes.trashBtn}`}
          onClick={(ev)=>{ ev.stopPropagation(); onDelete?.(id); }}
          aria-label="Удалить"
          title="Удалить"
        >
          <MdDeleteOutline className={classes.actionIcon}/>
          <span className={classes.actionText}>Удалить</span>
        </button>
      </div>

      {isEditing ? (
        <div
          ref={btnRef}
          className={`${classes.storyCard} ${classes.slide} ${classes.editingMode}`}
          style={{ transform:`translateX(${offset}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          data-story-id={id}
        >
          <input
            ref={inputRef}
            className={classes.titleInput}
            placeholder="Сформулируйте проблему"
            value={value}
            onChange={(e)=> setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={onInputKeyDown}
            type="text"
            inputMode="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            enterKeyHint="done"
            aria-label="Заголовок истории"
            autoFocus
          />
        </div>
      ) : (
        <button
          ref={btnRef}
          className={`${classes.storyCard} ${classes.slide} ${draggingActive ? classes.dragging : ''} ${isHighlighted ? classes.storyCardActive : ''}`}
          style={{ transform:`translateX(${offset}px)` }}
          onClick={onRowClick}
          onContextMenu={onContext}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          data-story-id={id}
        >
          <>
            <span className={`${classes.titleText} ${!hadTitle ? classes.placeholderText : ''}`}>
              {displayTitle}
            </span>
            {showTime && <span className={classes.timeRight}>{editedLabel}</span>}
          </>
        </button>
      )}
    </div>
  );
}
