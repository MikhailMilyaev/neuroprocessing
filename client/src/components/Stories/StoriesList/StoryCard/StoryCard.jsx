import classes from './StoryCard.module.css';
import { useNavigate } from 'react-router-dom';
import { STORY_ROUTE } from '../../../../utils/consts';
import { useMemo, useRef, useState } from 'react';
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
    const x = clientX - r.left - size/2;
    const y = clientY - r.top  - size/2;
    const wave = document.createElement('span');
    wave.className = `${classes.ripple} ${right?classes.rippleRight:classes.rippleLeft}`;
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${x}px`; wave.style.top = `${y}px`;
    el.appendChild(wave);
    wave.addEventListener('animationend', ()=> wave.remove());
  };

  // свайп (только мобилки)
  const ACTION_W = 72, REVEAL_T = 24;
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const isMobile = ()=> window.matchMedia('(max-width:700px)').matches;

  const onTouchStart = (e)=>{ if(!isMobile()) return; dragging.current = true; startX.current = e.touches[0].clientX; };
  const onTouchMove  = (e)=>{ if(!isMobile() || !dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const x = Math.max(-ACTION_W, Math.min(0, dx + (revealed ? -ACTION_W : 0)));
    setOffset(x);
  };
  const onTouchEnd   = ()=>{ if(!isMobile()) return; dragging.current = false;
    if(offset <= -REVEAL_T){ setOffset(-ACTION_W); setRevealed(true); }
    else { setOffset(0); setRevealed(false); }
  };

  const onClick=(e)=>{
    if(revealed && isMobile()){ e.preventDefault(); setOffset(0); setRevealed(false); return; }
    spawnRipple(e.clientX ?? 0, e.clientY ?? 0, false);
    navigate(targetUrl);
  };

  const onContext=(e)=>{
    if(isMobile()){ e.preventDefault(); return; }
    spawnRipple(e.clientX, e.clientY, true);
    onContextMenu?.(e, id);
  };

  return (
    <div className={classes.row}>
      {/* подложка действия */}
      <div className={`${classes.actions} ${revealed || offset < 0 ? classes.actionsShown : ''}`} aria-hidden={!revealed && !(offset < 0)}>
        <button
          type="button"
          className={classes.trashBtn}
          onClick={(ev)=>{ ev.stopPropagation(); onDelete?.(id); }}
          aria-label="Удалить"
          title="Удалить"
        >
          <MdDeleteOutline/>
        </button>
      </div>

      {/* сама карточка */}
      <button
        ref={btnRef}
        className={`${classes.storyCard} ${classes.slide} ${isHighlighted ? classes.storyCardActive : ''}`}
        style={{ transform:`translateX(${offset}px)` }}
        onClick={onClick}
        onContextMenu={onContext}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className={`${classes.titleText} ${isTitleEmpty ? classes.placeholderText : ''}`}>
          {displayTitle}
        </span>
        {editedLabel && <span className={classes.timeRight}>{editedLabel}</span>}
      </button>
    </div>
  );
}
