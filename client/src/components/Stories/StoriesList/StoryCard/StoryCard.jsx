import classes from './StoryCard.module.css';
import { useNavigate } from 'react-router-dom';
import { STORY_ROUTE } from '../../../../utils/consts';
import { useMemo, useRef, useState, useEffect } from 'react';
import { MdDeleteOutline } from 'react-icons/md';

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
  id, slug, title, updatedAt, updated_at,
  isHighlighted, onContextMenu, onDelete,
  closeKey = 0,                 
}){
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const editedLabel = useMemo(()=>formatEditedAt(updatedAt ?? updated_at),[updatedAt,updated_at]);
  const isTitleEmpty = !title?.trim();
  const displayTitle = isTitleEmpty ? 'Сформулируйте проблему' : title;
  const targetUrl = `${STORY_ROUTE}/${slug || id}`;

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

  const ACTION_W = 96;                 
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
  const isMobile = ()=> window.matchMedia('(max-width:700px)').matches;

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

  const onClick=(e)=>{
    if(revealed && isMobile()){ e.preventDefault(); closeSwipe(); return; }
    spawnRipple(e.clientX ?? 0, e.clientY ?? 0, false);
    navigate(targetUrl);
  };

  const onContext=(e)=>{
    if(isMobile()){ e.preventDefault(); return; }
    spawnRipple(e.clientX, e.clientY, true);
    onContextMenu?.(e, id);
  };

  const rowRevealed = (revealed || offset < 0);

  return (
    <div className={`${classes.row} ${rowRevealed ? classes.rowRevealed : ''}`}>
      <div className={classes.actions} aria-hidden={!rowRevealed}>
        <button
          type="button"
          className={classes.trashBtn}
          onClick={(ev)=>{ ev.stopPropagation(); onDelete?.(id); }}
          aria-label="Удалить"
          title="Удалить"
        >
          <MdDeleteOutline className={classes.trashIcon}/>
          <span className={classes.trashText}>Удалить</span>
        </button>
      </div>

      <button
        ref={btnRef}
        className={`${classes.storyCard} ${classes.slide} ${draggingActive ? classes.dragging : ''} ${isHighlighted ? classes.storyCardActive : ''}`}
        style={{ transform:`translateX(${offset}px)` }}
        onClick={onClick}
        onContextMenu={onContext}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        data-story-id={id}
      >
        <span className={`${classes.titleText} ${isTitleEmpty ? classes.placeholderText : ''}`}>
          {displayTitle}
        </span>
        {editedLabel && <span className={classes.timeRight}>{editedLabel}</span>}
      </button>
    </div>
  );
}
