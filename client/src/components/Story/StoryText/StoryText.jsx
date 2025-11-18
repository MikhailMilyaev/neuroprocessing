import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import classes from './StoryText.module.css';

const MIN_H = 120;
const DEFAULT_VH_RATIO = 0.45;
const SAVE_DEBOUNCE = 90;
const DEFAULT_H_KEY = 'story_text_user_h';

const parsePx = (v) => {
  const n = parseFloat(String(v || '').trim());
  return Number.isFinite(n) ? n : 0;
};

const getHeaderH = () => {
  try {
    const cs = getComputedStyle(document.documentElement);
    return parsePx(cs.getPropertyValue('--story-header-h'));
  } catch { return 0; }
};

const getSafeInsets = () => {
  try {
    const probe = getComputedStyle(document.documentElement);
    const top = parsePx(probe.getPropertyValue('env(safe-area-inset-top)'));
    const bottom = parsePx(probe.getPropertyValue('env(safe-area-inset-bottom)'));
    return { top, bottom };
  } catch { return { top: 0, bottom: 0 }; }
};

const isMobileUA = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width:700px)').matches &&
  window.matchMedia('(hover: none)').matches &&
  window.matchMedia('(pointer: coarse)').matches;

export default function StoryText({
  value,
  onChange,
  initialViewContentY = null,
  onViewYChange,
  onReady,
  vhRatio = DEFAULT_VH_RATIO,
  resizable = true,
  storageKey = DEFAULT_H_KEY,
}) {
  const stageRef    = useRef(null);
  const editableRef = useRef(null);
  const saveTimer   = useRef(null);

  const [localText, setLocalText] = useState(value ?? '');
  const [autoMaxH, setAutoMaxH] = useState(() =>
    Math.max(MIN_H, Math.round(window.innerHeight * vhRatio))
  );

  const computeMaxPx = useCallback(() => {
    const header = getHeaderH();
    const { bottom } = getSafeInsets();
    const pad = 8; 
    const max = Math.max(MIN_H, Math.floor(window.innerHeight - header - bottom - pad));
    return max;
  }, []);

  const [maxPx, setMaxPx] = useState(() => computeMaxPx());

  const [userH, setUserH] = useState(() => {
    try {
      const v = Number(localStorage.getItem(storageKey));
      return Number.isFinite(v) ? v : null;
    } catch { return null; }
  });

  const mobile = isMobileUA();

  const isEmpty = useCallback((s) => {
    const str = String(s ?? '')
      .replace(/\u00A0/g, ' ')
      .replace(/\u200B/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
    return str.length === 0;
  }, []);

  useEffect(() => { setLocalText(value ?? ''); }, [value]);

  useLayoutEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    const next = localText ?? '';
    if (el.textContent !== next) el.textContent = next;
    el.setAttribute('data-empty', isEmpty(next) ? 'true' : 'false');
  }, [localText, isEmpty]);

  const applyHeights = useCallback(() => {
    const el = editableRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;

    if (userH != null) {
      const fixed = Math.max(MIN_H, Math.min(maxPx, Math.round(userH)));
      stage.style.height = `${fixed}px`;
      stage.style.overflowY = 'auto';
      stage.style.overflowX = 'hidden';
      stage.style.setProperty('overflow-anchor', 'none');
      return;
    }

    const text = (el.textContent ?? '').replace(/\r\n/g, '\n');
    const last = el.lastChild;

    const cs = getComputedStyle(el);
    const lineH = (() => {
      const lh = cs.lineHeight || '';
      if (lh.endsWith('px')) return parseFloat(lh) || 0;
      const fs = parseFloat(cs.fontSize) || 16;
      const factor = parseFloat(lh) || 1.6;
      return fs * factor;
    })();

    const hasTrailingBr =
      last &&
      last.nodeType === 1 &&
      (last.nodeName === 'BR' ||
        (/^(DIV|P)$/i.test(last.nodeName) &&
          last.childNodes.length === 1 &&
          last.firstChild?.nodeName === 'BR'));

    const correction = hasTrailingBr && text.endsWith('\n') ? lineH : 0;
    const natural = Math.ceil(el.scrollHeight - correction);
    const cap = Math.min(autoMaxH, maxPx);  
    const h = Math.max(MIN_H, Math.min(cap, natural));

    stage.style.height = `${h}px`;
    stage.style.overflowY = natural > cap ? 'auto' : 'hidden';
    stage.style.overflowX = 'hidden';
    stage.style.setProperty('overflow-anchor', 'none');
  }, [userH, autoMaxH, maxPx]);

  useLayoutEffect(() => { applyHeights(); }, [localText, applyHeights]);

  useEffect(() => {
    const recalc = () => {
      setMaxPx(computeMaxPx());
      setAutoMaxH(Math.max(MIN_H, Math.round(window.innerHeight * vhRatio)));
      setUserH((prev) => {
        if (prev == null) return prev;
        const clamped = Math.max(MIN_H, Math.min(computeMaxPx(), Math.round(prev)));
        if (clamped !== prev) {
          try { localStorage.setItem(storageKey, String(clamped)); } catch {}
        }
        return clamped;
      });
    };

    const onResize = () => recalc();
    const onOrient = () => recalc();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);

    const ro = 'ResizeObserver' in window ? new ResizeObserver(recalc) : null;
    ro?.observe(document.body);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
      ro?.disconnect();
    };
  }, [vhRatio, storageKey, computeMaxPx]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (initialViewContentY == null) return;
    const t = requestAnimationFrame(() => {
      const top = Math.max(
        0,
        Math.min(initialViewContentY, stage.scrollHeight - stage.clientHeight)
      );
      stage.scrollTop = top;
    });
    return () => cancelAnimationFrame(t);
  }, [initialViewContentY]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onScroll = () => onViewYChange?.(stage.scrollTop);
    stage.addEventListener('scroll', onScroll, { passive: true });
    return () => stage.removeEventListener('scroll', onScroll);
  }, [onViewYChange]);

  useEffect(() => {
    const t = requestAnimationFrame(() => onReady?.());
    return () => cancelAnimationFrame(t);
  }, [onReady]);

  const handleInput = (txt) => {
    setLocalText(txt);
    const el = editableRef.current;
    if (el) el.setAttribute('data-empty', isEmpty(txt) ? 'true' : 'false');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onChange?.(txt), SAVE_DEBOUNCE);
  };

  const dragRef = useRef({
    active: false,
    startY: 0,
    startH: 0,
  });
  const [dragging, setDragging] = useState(false);

  const getPoint = (e) => (e?.touches?.[0] || e);

  const applyUserH = useCallback((h) => {
    const clamped = Math.max(MIN_H, Math.min(maxPx, Math.round(h)));
    setUserH((prev) => {
      if (prev === clamped) return prev;
      try { localStorage.setItem(storageKey, String(clamped)); } catch {}
      return clamped;
    });
  }, [maxPx, storageKey]);

  const onMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const p = getPoint(e);
    const dy = p.clientY - dragRef.current.startY;
    const raw = dragRef.current.startH + dy;
    applyUserH(raw);
    e.preventDefault?.();
  }, [applyUserH]);

  const stopDrag = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    try {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    } catch {}
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onMove, { passive: false });
    window.removeEventListener('touchend', stopDrag);
  }, [onMove]);

  const beginDrag = (e) => {
    if (!resizable) return;
    const p = getPoint(e);
    dragRef.current.active = true;
    dragRef.current.startY = p.clientY;
    const stage = stageRef.current;
    const rectH = stage?.getBoundingClientRect().height || MIN_H;
    dragRef.current.startH = Math.round(rectH);
    setDragging(true);
    try {
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } catch {}
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    e.preventDefault?.();
  };

  const handleDoubleClick = () => {
    setUserH(null);
    try { localStorage.removeItem(storageKey); } catch {}
    setTimeout(applyHeights, 0);
  };

  const stageStyle = userH != null
    ? {
        height: Math.max(MIN_H, Math.min(maxPx, Math.round(userH))),
        maxHeight: maxPx,
        minHeight: MIN_H,
      }
    : {
        maxHeight: maxPx,
        minHeight: MIN_H,
      };

  return (
    <div className={classes.wrapper}>
      <div
        ref={stageRef}
        className={`${classes.stage} ${dragging ? classes.stageDragging : ''}`}
        style={stageStyle}
        onDoubleClick={handleDoubleClick}
      >
        <pre
          ref={editableRef}
          className={classes.editable}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck
          data-placeholder="Опишите свою проблему или историю, в которой она произошла..."
          data-empty={isEmpty(localText) ? 'true' : 'false'}
          onInput={(e) => handleInput(e.currentTarget.textContent ?? '')}
        />

        {resizable && (
          <div
            className={`${classes.resizeHandle} ${dragging ? classes.handleActive : ''} ${mobile ? classes.isMobile : classes.isDesktop}`}
            onMouseDown={beginDrag}
            onTouchStart={beginDrag}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Потяните, чтобы изменить высоту"
          >
            <div className={classes.resizeHandleBar} />
          </div>
        )}
      </div>
    </div>
  );
}
