// client/src/components/Story/StoryText/StoryText.jsx
import {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
} from 'react';
import { FcIdea } from 'react-icons/fc';
import Spinner from '../../Spinner/Spinner';
import classes from './StoryText.module.css';
import { setStoryStop, clearStoryStop as apiClearStoryStop } from '../../../http/storyApi';

const MIN_H = 120;
const MAX_CAP = 500;
const DEFAULT_VH_RATIO = 0.45;
const UNDERLINE_H = 2;
const LINE_GAP = 1;
const VISIBLE_MIN_WIDTH = 0;

// размеры/отступ для баббла
const BUBBLE_SIZE = 40;
const BUBBLE_W = BUBBLE_SIZE;
const BUBBLE_H = BUBBLE_SIZE;
const BUBBLE_MARGIN = 12;

const computeMaxH = (vhRatio = DEFAULT_VH_RATIO) =>
  Math.max(MIN_H, Math.min(MAX_CAP, Math.round(window.innerHeight * vhRatio)));

// ——— string utils ———
const getLineStartByLi = (text, li) => {
  if (!text || li <= 0) return 0;
  let idx = 0, seen = 0;
  while (seen < li) {
    const n = text.indexOf('\n', idx);
    if (n === -1) return text.length;
    idx = n + 1;
    seen++;
  }
  return idx;
};
const getLineEndFromStart = (text, start) => {
  if (!text) return 0;
  const n = text.indexOf('\n', start);
  return n === -1 ? text.length : n;
};
const countNewlinesBefore = (text, idx) => {
  if (!text || idx <= 0) return 0;
  let c = 0;
  for (let i = 0; i < idx && i < text.length; i++) if (text.charCodeAt(i) === 10) c++;
  return c;
};
const diffPrefixSuffix = (prev, next) => {
  const n1 = prev.length, n2 = next.length;
  let p = 0;
  while (p < n1 && p < n2 && prev.charCodeAt(p) === next.charCodeAt(p)) p++;
  let s = 0;
  while (
    s < (n1 - p) &&
    s < (n2 - p) &&
    prev.charCodeAt(n1 - 1 - s) === next.charCodeAt(n2 - 1 - s)
  ) s++;
  return { prefix: p, suffix: s };
};

// ——— map absolute index → (line, col) ———
const absToLiCol = (fullText, abs) => {
  const lines = (fullText ?? '').split(/\r?\n/);
  let rest = abs;
  let li = 0;
  for (; li < lines.length; li++) {
    const len = lines[li].length;
    if (rest <= len) break;
    rest -= len;
    if (li < lines.length - 1) rest -= 1; // \n
  }
  return { li, col: Math.max(0, rest), lines };
};

const getVScrollWidth = (el) =>
  !el ? 0 : Math.max(0, el.offsetWidth - el.clientWidth);

/** Координата каретки (коллапс-диапазон на символе col в строке li) */
const getCaretAnchor = (absIndex, mirrorEl, mirrorTextEl, fullText, stageEl) => {
  if (!mirrorEl || !mirrorTextEl || !stageEl) return null;
  if (absIndex == null) return null;

  const { li, col } = absToLiCol(fullText, absIndex);
  const line = mirrorTextEl.querySelector(`[data-line="${li}"]`);
  const tn = line?.firstChild;
  const len = tn?.textContent?.length ?? 0;
  if (!tn) return null;

  const off = Math.max(0, Math.min(col, len));
  const range = document.createRange();
  try {
    range.setStart(tn, off);
    range.setEnd(tn, off);
  } catch {
    return null;
  }
  const rect = range.getBoundingClientRect();
  if (!rect) return null;

  const stageBox = stageEl.getBoundingClientRect();
  const leftLocal = rect.left - stageBox.left;
  const topLocal = rect.top - stageBox.top;
  const bottomLocal = rect.bottom - stageBox.top;

  return { centerX: leftLocal, topY: topLocal, bottomY: bottomLocal };
};

// прямоугольники для подсветки (в координатах mirror)
const getClientRectsForRange = (start, end, mirrorEl, mirrorTextEl, fullText) => {
  if (!mirrorEl || !mirrorTextEl || start == null || end == null || start >= end) return [];
  const mbox = mirrorEl.getBoundingClientRect();

  const toLiCol = (abs) => absToLiCol(fullText, abs);
  const a = toLiCol(start);
  const b = toLiCol(end);
  const liStart = a.li, liEnd = b.li;
  const rects = [];
  for (let li = liStart; li <= liEnd; li++) {
    const span = mirrorTextEl.querySelector(`[data-line="${li}"]`);
    if (!span) continue;
    const tn = span.firstChild;
    if (!tn || typeof tn.textContent !== 'string') continue;
    const lineLen = tn.textContent.length;
    const from = li === liStart ? Math.min(a.col, lineLen) : 0;
    const to   = li === liEnd   ? Math.min(b.col, lineLen) : lineLen;
    if (to <= from) continue;
    const range = document.createRange();
    range.setStart(tn, from);
    range.setEnd(tn, to);
    for (const r of range.getClientRects()) {
      rects.push({
        left: (r.left - mbox.left),
        top: (r.top - mbox.top),
        width: r.width,
        height: r.height,
      });
    }
  }
  return rects;
};

export default function StoryText({
  value,
  onChange,
  storyId,
  initialStopContentY = null,
  initialViewContentY = null,
  onViewYChange,
  onReady,
  vhRatio = DEFAULT_VH_RATIO,
  onStopChange,
  onAddIdeaFromSelection,
  activeHighlight = null,

  /* 🎤 STT событие из Story.jsx */
  sttEvent = null,
}) {
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const mirrorTextRef = useRef(null);

  const gutterRef = useRef(null);
  const gutterInnerRef = useRef(null);
  const underlinesRef = useRef(null);
  const highlightsRef = useRef(null);

  const topEdgeBtnRef = useRef(null);
  const bottomEdgeBtnRef = useRef(null);

  const bubbleRef = useRef(null);

  const [rects, setRects] = useState([]);
  const rectsRef = useRef([]);
  const [selected, setSelected] = useState(() => new Set());
  const selectedRef = useRef(new Set());
  const [hoverIdx, setHoverIdx] = useState(null);

  const [hlRects, setHlRects] = useState([]);

  const padTopRef = useRef(0);
  const padLeftRef = useRef(0);
  const padRightRef = useRef(0);
  const rafScrollLock = useRef(false);

  const topEdgeTargetYRef = useRef(null);
  const bottomEdgeTargetYRef = useRef(null);

  const [selBubble, setSelBubble] = useState({
    show: false, x: 0, y: 0, below: false, text: '', start: null, end: null
  });
  const bubbleRafRef = useRef(null);
  const bubbleTimeoutRef = useRef(null);
  const lastSelectionRef = useRef(null);

  const [maxH, setMaxH] = useState(() => computeMaxH(vhRatio));
  useEffect(() => {
    const onResize = () => setMaxH(computeMaxH(vhRatio));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [vhRatio]);

  const restoredOnceRef = useRef(false);

  const activeStopContentYRef = useRef(null);
  const activeLineStartRef = useRef(null);
  const activeLineEndRef = useRef(null);
  const activeLineWrapRef = useRef(0);

  const prevValueRef = useRef(value ?? '');
  useEffect(() => { prevValueRef.current = value ?? ''; }, [value]);

  const [localText, setLocalText] = useState(value ?? '');
  useEffect(() => { setLocalText(value ?? ''); }, [value]);
  const deferredText = useDeferredValue(localText);
  const flushTimerRef = useRef(null);

  const contentIsEmpty = !localText || localText.trim().length === 0;

  // API
  const saveStop = useCallback(async (contentY) => {
    if (!storyId || contentY == null) return;
    try { await setStoryStop(storyId, Math.round(contentY)); }
    catch (e) { console.error('Failed to save stopContentY', e); }
  }, [storyId]);

  const clearStop = useCallback(async () => {
    if (!storyId) return;
    try { await apiClearStoryStop(storyId); }
    catch (e) { console.error('Failed to clear stopContentY', e); }
  }, [storyId]);

  const getCurrentLiFromAnchor = (text) => {
    const s = activeLineStartRef.current;
    if (s == null || s < 0 || s > (text?.length ?? 0)) return null;
    return countNewlinesBefore(text, s);
  };

  // ——— offscreen indicators ———
  const updateOffscreenIndicators = useCallback(() => {
    const t = textareaRef.current;
    const gutter = gutterRef.current;
    if (!t || !gutter) return;

    const topBtn = topEdgeBtnRef.current;
    const bottomBtn = bottomEdgeBtnRef.current;
    if (!topBtn || !bottomBtn) return;

    const hideBtn = (btn) => {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      btn.classList.remove(classes.gutterBtnActive);
    };

    hideBtn(topBtn);
    hideBtn(bottomBtn);
    topEdgeTargetYRef.current = null;
    bottomEdgeTargetYRef.current = null;

    if (contentIsEmpty) {
      gutter.classList.remove(classes.gutterForceVisible);
      return;
    }

    let anyShown = false;
    const sel = selectedRef.current;
    if (!sel || sel.size !== 1) {
      gutter.classList.remove(classes.gutterForceVisible);
      return;
    }

    const [idx] = sel;
    const r = rectsRef.current.find(x => x.i === idx);
    if (!r) {
      gutter.classList.remove(classes.gutterForceVisible);
      return;
    }

    const padTop = padTopRef.current;
    const viewTop = t.scrollTop + padTop;
    const viewBottom = t.scrollTop + t.clientHeight + padTop;

    if (r.bottom < viewTop) {
      topBtn.style.opacity = '1';
      topBtn.style.pointerEvents = 'auto';
      topBtn.classList.add(classes.gutterBtnActive);
      topEdgeTargetYRef.current = r.top - padTop;
      anyShown = true;
    }
    if (r.top > viewBottom) {
      bottomBtn.style.opacity = '1';
      bottomBtn.style.pointerEvents = 'auto';
      bottomBtn.classList.add(classes.gutterBtnActive);
      bottomEdgeTargetYRef.current = r.top - padTop;
      anyShown = true;
    }
    gutter.classList.toggle(classes.gutterForceVisible, anyShown);
  }, [contentIsEmpty]);

  // ===== RAF-троттлинг измерений =====
  const measureScheduled = useRef(false);
  const measureRef = useRef(() => {});
  const measure = useCallback(() => measureRef.current(), []);
  const requestMeasure = useCallback(() => {
    if (measureScheduled.current) return;
    measureScheduled.current = true;
    requestAnimationFrame(() => {
      measureScheduled.current = false;
      measure();
    });
  }, [measure]);

  // ——— main measure ———
  useEffect(() => {
    measureRef.current = () => {
      const m = mirrorRef.current;
      const t = textareaRef.current;
      const root = mirrorTextRef.current;
      const renderText = deferredText ?? '';
      if (!m || !t || !root) return;

      if ((renderText ?? '').trim().length === 0) {
        setRects([]);
        rectsRef.current = [];
        requestAnimationFrame(updateOffscreenIndicators);
        return;
      }

      const mbox = m.getBoundingClientRect();
      const viewTopAbs = 0 + t.scrollTop;
      const viewBotAbs = t.scrollTop + m.clientHeight;
      const BUF = 600;

      const lines = renderText.split(/\r?\n/);

      let runningIdx = 0;
      const list = [];

      const lineNodes = root.querySelectorAll('[data-line]');
      lineNodes.forEach((node) => {
        const bbox = node.getBoundingClientRect();
        const nodeTopAbs = (bbox.top - mbox.top);
        const nodeBotAbs = (bbox.bottom - mbox.top);
        if (nodeBotAbs < (viewTopAbs - BUF) || nodeTopAbs > (viewBotAbs + BUF)) {
          return;
        }

        const li = Number(node.getAttribute('data-line')) || 0;
        const txt = lines[li] ?? '';
        if (/^\s*$/.test(txt)) return;

        const rectList = Array.from(node.getClientRects());
        rectList.forEach((r, wrap) => {
          list.push({
            i: runningIdx++,
            li,
            wrap,
            left: r.left  - mbox.left,
            top: r.top    - mbox.top,
            bottom: r.bottom - mbox.top,
            width: r.width,
          });
        });
      });

      setRects(list);
      rectsRef.current = list;

      if (activeLineStartRef.current != null && activeLineEndRef.current != null) {
        const text = renderText;
        let s = activeLineStartRef.current;
        if (s < 0) s = 0;
        if (s > text.length) s = text.length;
        const liNow = getCurrentLiFromAnchor(text);
        if (liNow == null) {
          setSelected(new Set());
          activeStopContentYRef.current = null;
          requestAnimationFrame(updateOffscreenIndicators);
        } else {
          const startNow = getLineStartByLi(text, liNow);
          const endNow = getLineEndFromStart(text, startNow);
          if (/^\s*$/.test(text.slice(startNow, endNow))) {
            setSelected(new Set());
            activeStopContentYRef.current = null;
            requestAnimationFrame(updateOffscreenIndicators);
          } else {
            const wraps = list.filter(r => r.li === liNow);
            if (wraps.length === 0) {
              setSelected(new Set());
              activeStopContentYRef.current = null;
              requestAnimationFrame(updateOffscreenIndicators);
            } else {
              const wanted = Math.min(activeLineWrapRef.current ?? 0, wraps.length - 1);
              const pick = wraps.find(w => w.wrap === wanted) || wraps[wanted];
              if (pick) {
                const contentY = pick.top - (padTopRef.current || 0);
                activeStopContentYRef.current = contentY;
                activeLineWrapRef.current = pick.wrap;
                setSelected(new Set([pick.i]));
              }
            }
          }
        }
      } else {
        if (selectedRef.current.size) setSelected(new Set());
      }

      requestAnimationFrame(updateOffscreenIndicators);
    };
  }, [deferredText, updateOffscreenIndicators]);

  useLayoutEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    const recalcPads = () => {
      const cs = getComputedStyle(t);
      padTopRef.current = parseFloat(cs.paddingTop) || 0;
      padLeftRef.current = parseFloat(cs.paddingLeft) || 0;
      padRightRef.current = parseFloat(cs.paddingRight) || 0;
    };
    recalcPads();
    const onResize = () => recalcPads();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // === синхронизация типографики зеркала
  useEffect(() => {
    const ta = textareaRef.current;
    const mt = mirrorTextRef.current;
    const m  = mirrorRef.current;
    if (!ta || !mt || !m) return;

    m.style.overflow = 'hidden';

    const sync = () => {
      const cs = getComputedStyle(ta);
      mt.style.boxSizing = 'border-box';
      mt.style.width = `${ta.clientWidth}px`;

      mt.style.paddingLeft   = cs.paddingLeft;
      mt.style.paddingRight  = cs.paddingRight;
      mt.style.paddingTop    = cs.paddingTop;
      mt.style.paddingBottom = cs.paddingBottom;

      mt.style.font          = cs.font;
      mt.style.lineHeight    = cs.lineHeight;
      mt.style.letterSpacing = cs.letterSpacing;
      mt.style.wordSpacing   = cs.wordSpacing;
      mt.style.textTransform = cs.textTransform;
      mt.style.fontKerning   = cs.fontKerning;
      mt.style.fontFeatureSettings = cs.fontFeatureSettings;
      mt.style.fontVariationSettings = cs.fontVariationSettings;

      mt.style.whiteSpace   = 'pre-wrap';
      mt.style.wordBreak    = cs.wordBreak;
      mt.style.overflowWrap = cs.overflowWrap;
      mt.style.hyphens      = cs.hyphens;
      mt.style.direction    = cs.direction;
      mt.style.tabSize      = cs.tabSize;
    };

    const runSync = () => { sync(); requestAnimationFrame(sync); };

    runSync();

    const ro = new ResizeObserver(runSync);
    ro.observe(ta);
    window.addEventListener('resize', runSync);

    let fontReadyCancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { if (!fontReadyCancelled) runSync(); });
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', runSync);
      fontReadyCancelled = true;
    };
  }, []);

  // auto height
  useLayoutEffect(() => {
    const t = textareaRef.current;
    if (!t) return;

    if (contentIsEmpty) {
      t.style.height = `${MIN_H}px`;
      t.style.overflowY = 'hidden';
      t.scrollTop = 0;
      requestMeasure();
      return;
    }

    const padTop = padTopRef.current || 0;
    const prevClientH = t.clientHeight;
    const prevScrollTop = t.scrollTop;
    const contentTopBefore = prevScrollTop + padTop;

    t.value = localText;
    const natural = t.scrollHeight;
    const nextH = Math.max(Math.min(natural, maxH), MIN_H);
    const needResize = prevClientH !== nextH;

    if (needResize) {
      const wasAtBottom = prevScrollTop + prevClientH >= natural - 1;

      t.style.height = `${nextH}px`;
      t.style.overflowY = natural > maxH ? 'auto' : 'hidden';

      rafScrollLock.current = true;

      if (wasAtBottom) {
        const newTop = t.scrollHeight - t.clientHeight;
        t.scrollTop = newTop;
      } else {
        const newTop = Math.max(0, contentTopBefore - padTop);
        t.scrollTop = newTop;
      }

      requestAnimationFrame(() => { rafScrollLock.current = false; });
    } else {
      t.style.overflowY = natural > maxH ? 'auto' : 'hidden';
    }

    requestMeasure();
  }, [localText, requestMeasure, maxH, contentIsEmpty]);

  useEffect(() => {
    selectedRef.current = new Set(selected);
    if (selected.size === 1 && rectsRef.current.length) {
      const [idx] = selected;
      const r = rectsRef.current.find(x => x.i === idx);
      if (r) activeStopContentYRef.current = r.top - padTopRef.current;
    }
    requestAnimationFrame(updateOffscreenIndicators);
  }, [selected, updateOffscreenIndicators]);

  useEffect(() => {
    if (contentIsEmpty && selectedRef.current.size) {
      setSelected(new Set());
      activeStopContentYRef.current = null;
      activeLineStartRef.current = null;
      activeLineEndRef.current = null;
      activeLineWrapRef.current = 0;
      clearStop().catch(() => {});
      onStopChange?.(null);
    }
  }, [contentIsEmpty, clearStop, onStopChange]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || restoredOnceRef.current) return;
    const doRestore = () => {
      if (initialViewContentY != null) {
        const padTop = padTopRef.current || 0;
        const raw = Math.round(initialViewContentY - padTop);
        const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
        const clamp = Math.min(Math.max(raw, 0), maxScroll);
        el.scrollTop = clamp;
      }
      restoredOnceRef.current = true;
      if (typeof onReady === 'function') onReady();
    };
    requestAnimationFrame(() => requestAnimationFrame(doRestore));
  }, [initialViewContentY, maxH, onReady]);

  // ===== 🎤 STТ: базовые сущности до эффектов, которые их используют =====
  const sttLastStampRef = useRef(null);           // "key:phase" последнего обработанного события
  const sttCaretRef = useRef(null);               // { key, pos } куда вставлять результат
  const [sttBusy, setSttBusy] = useState(false);  // показать спиннер
  const sttBusyRef = useRef(false);
  useEffect(() => { sttBusyRef.current = sttBusy; }, [sttBusy]);

  // локальный предохранитель (если вдруг resolve/cancel не придёт)
  const sttLocalFuseRef = useRef(null);
  // позиция спиннера у каретки
  const [sttSpin, setSttSpin] = useState({ show: false, x: 0, y: 0 });

  const recalcSttSpinnerPos = useCallback(() => {
    if (!sttBusyRef.current || !sttCaretRef.current) {
      setSttSpin(s => (s.show ? { ...s, show: false } : s));
      return;
    }

    const stage = stageRef.current;
    const ta    = textareaRef.current;
    const anchor = getCaretAnchor(
      sttCaretRef.current.pos,
      mirrorRef.current,
      mirrorTextRef.current,
      deferredText ?? '',
      stage
    );

    if (!stage || !ta || !anchor) {
      setSttSpin(s => (s.show ? { ...s, show: false } : s));
      return;
    }

    // учитываем прокрутку textarea (подложки мы сдвигаем transform'ом)
    const sbw = getVScrollWidth(ta);
    const x = anchor.centerX - (ta.scrollLeft || 0) + sbw + 8;
    const y = anchor.bottomY  - (ta.scrollTop  || 0) + 4; // чуть ниже каретки

    // не даём спиннеру «улетать» за края stage
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const maxX = Math.max(0, stage.clientWidth  - 2);
    const maxY = Math.max(0, stage.clientHeight - 2);

    setSttSpin({
      show: true,
      x: clamp(x, 2, maxX),
      y: clamp(y, 2, maxY),
    });
  }, [deferredText]);


  // sync scroll → двигаем слои
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !underlinesRef.current || !gutterInnerRef.current) return;

    const applyScrollTransform = () => {
      const st = el.scrollTop;
      const sl = el.scrollLeft;
      if (underlinesRef.current) underlinesRef.current.style.transform = `translate(${-sl}px, ${-st}px)`;
      if (highlightsRef.current) highlightsRef.current.style.transform = `translate(${-sl}px, ${-st}px)`;
      if (gutterInnerRef.current) gutterInnerRef.current.style.transform = `translateY(${-st}px)`;
    };

    const onScroll = () => {
      if (rafScrollLock.current) return;
      rafScrollLock.current = true;
      requestAnimationFrame(() => {
        rafScrollLock.current = false;
        applyScrollTransform();
        updateOffscreenIndicators();
        if (typeof onViewYChange === 'function') {
          const padTop = padTopRef.current || 0;
          const contentTopY = el.scrollTop + padTop;
          onViewYChange(Math.round(contentTopY));
        }
        // если идёт диктовка — пересчитываем позицию спиннера у каретки
        if (sttBusyRef.current) {
          recalcSttSpinnerPos();
        }
      });
    };

    applyScrollTransform();
    updateOffscreenIndicators();

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateOffscreenIndicators, onViewYChange, recalcSttSpinnerPos]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        requestMeasure();
        updateOffscreenIndicators();
        if (sttBusyRef.current) recalcSttSpinnerPos();
      });
    });
    if (mirrorRef.current) ro.observe(mirrorRef.current);
    const onWinResize = () => {
      requestMeasure();
      updateOffscreenIndicators();
      if (sttBusyRef.current) recalcSttSpinnerPos();
    };
    window.addEventListener('resize', onWinResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWinResize);
    };
  }, [requestMeasure, updateOffscreenIndicators, recalcSttSpinnerPos]);

  useEffect(() => {
    if (initialStopContentY == null) return;
    const list = rectsRef.current;
    if (!list.length) return;
    const targetAbs = initialStopContentY + padTopRef.current;
    let bestIdx = null;
    let bestDist = Infinity;
    for (const r of list) {
      const dist = Math.abs(r.top - targetAbs);
      if (dist < bestDist) { bestDist = dist; bestIdx = r.i; }
    }
    if (bestIdx != null) {
      setSelected(new Set([bestIdx]));
      const rr = list.find(r => r.i === bestIdx);
      if (rr) {
        activeStopContentYRef.current = rr.top - padTopRef.current;
        const text = deferredText ?? '';
        const start = getLineStartByLi(text, rr.li);
        const end = getLineEndFromStart(text, start);
        activeLineStartRef.current = start;
        activeLineEndRef.current = end;
        activeLineWrapRef.current = rr.wrap ?? 0;
      }
    }
  }, [deferredText, initialStopContentY]);

  useEffect(() => {
    if (initialStopContentY == null) {
      if (selectedRef.current.size) setSelected(new Set());
      activeStopContentYRef.current = null;
      activeLineStartRef.current = null;
      activeLineEndRef.current = null;
      activeLineWrapRef.current = 0;
    }
  }, [initialStopContentY]);

  const scrollToContentY = (contentTopY) => {
    const t = textareaRef.current;
    if (!t || contentTopY == null) return;
    const padTop = padTopRef.current;
    const y = contentTopY - 8 - padTop;
    t.scrollTo({ top: y, behavior: 'smooth' });
  };
  const onTopEdgeClick = () => scrollToContentY(topEdgeTargetYRef.current);
  const onBottomEdgeClick = () => scrollToContentY(bottomEdgeTargetYRef.current);

  const findIndexByY = (clientY) => {
    if (contentIsEmpty) return null;
    const g = gutterRef.current;
    const t = textareaRef.current;
    if (!g || !t) return null;
    const gbox = g.getBoundingClientRect();
    const contentY = (clientY - gbox.top) + t.scrollTop + padTopRef.current;
    const list = rectsRef.current;
    const i = list.findIndex(r => contentY >= r.top && contentY <= r.bottom);
    return i === -1 ? null : i;
  };
  const onGutterMove = (e) => { if (contentIsEmpty) setHoverIdx(null); else setHoverIdx(findIndexByY(e.clientY)); };
  const onGutterEnter = (e) => { if (contentIsEmpty) setHoverIdx(null); else setHoverIdx(findIndexByY(e.clientY)); };
  const onGutterLeave = () => setHoverIdx(null);

  const toggle = (i) => {
    if (contentIsEmpty) return;
    setSelected(prev => {
      if (prev.has(i)) {
        clearStop();
        activeStopContentYRef.current = null;
        activeLineStartRef.current = null;
        activeLineEndRef.current = null;
        activeLineWrapRef.current = 0;
        onStopChange?.(null);
        return new Set();
      }
      const r = rectsRef.current.find(x => x.i === i);
      const padTop = padTopRef.current;
      const contentY = r ? (r.top - padTop) : null;
      if (contentY != null) {
        activeStopContentYRef.current = contentY;
        saveStop(contentY);
        onStopChange?.(contentY);

        const text = deferredText ?? '';
        const start = getLineStartByLi(text, r.li);
        const end = getLineEndFromStart(text, start);
        activeLineStartRef.current = start;
        activeLineEndRef.current = end;
        activeLineWrapRef.current = r?.wrap ?? 0;
      }
      return new Set([i]);
    });
  };

  const handleInput = useCallback((nextText) => {
    const prevText = prevValueRef.current ?? '';

    if (activeLineStartRef.current != null && activeLineEndRef.current != null) {
      const { prefix, suffix } = diffPrefixSuffix(prevText, nextText);
      const removed = prevText.slice(prefix, prevText.length - suffix);
      const inserted = nextText.slice(prefix, nextText.length - suffix);
      const changeStart = prefix;
      const changeEndPrev = prevText.length - suffix;
      const delta = inserted.length - removed.length;

      let s = activeLineStartRef.current;
      let e = activeLineEndRef.current;

      const overlaps = !(changeEndPrev <= s || changeStart >= e);
      const changeHasNewline = removed.indexOf('\n') !== -1 || inserted.indexOf('\n') !== -1;

      if (!overlaps) {
        if (changeEndPrev <= s) { s += delta; e += delta; }
        const txt = nextText;
        const sNow = Math.max(0, Math.min(s, txt.length));
        const eNow = getLineEndFromStart(txt, sNow);
        if (/^\s*$/.test(txt.slice(sNow, eNow))) {
          setSelected(new Set());
          activeStopContentYRef.current = null;
          activeLineStartRef.current = null;
          activeLineEndRef.current = null;
          activeLineWrapRef.current = 0;
          clearStop().catch(() => {});
          onStopChange?.(null);
        } else {
          activeLineStartRef.current = sNow;
          activeLineEndRef.current = eNow;
        }
      } else {
        if (changeHasNewline) {
          setSelected(new Set());
          activeStopContentYRef.current = null;
          activeLineStartRef.current = null;
          activeLineEndRef.current = null;
          activeLineWrapRef.current = 0;
          clearStop().catch(() => {});
          onStopChange?.(null);
        } else {
          const sNow = s + (changeStart < s ? delta : 0);
          const txt = nextText;
          const safeStart = Math.max(0, Math.min(sNow, txt.length));
          const eNow = getLineEndFromStart(txt, safeStart);
          if (/^\s*$/.test(txt.slice(safeStart, eNow))) {
            setSelected(new Set());
            activeStopContentYRef.current = null;
            activeLineStartRef.current = null;
            activeLineEndRef.current = null;
            activeLineWrapRef.current = 0;
            clearStop().catch(() => {});
            onStopChange?.(null);
          } else {
            activeLineStartRef.current = safeStart;
            activeLineEndRef.current = eNow;
          }
        }
      }
    }

    setLocalText(nextText);

    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      onChange?.(nextText);
      prevValueRef.current = nextText;
    }, 90);

    setSelBubble(b => (b.show ? { ...b, show: false } : b));
  }, [onChange, clearStop, onStopChange]);

// ===== Selection bubble — устойчиво к скроллу и переносам =====
const recalcSelectionBubbleNow = useCallback(() => {
  const ta    = textareaRef.current;
  const stage = stageRef.current;
  const mRoot = mirrorRef.current;
  const mText = mirrorTextRef.current;

  // если чего-то нет — просто спрячем
  if (!ta || !stage || !mRoot || !mText) {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  const start = ta.selectionStart ?? 0;
  const end   = ta.selectionEnd   ?? 0;
  if (start == null || end == null || start === end) {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  const fullText = deferredText ?? '';
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const raw = fullText.slice(s, e);
  const textTrimmed = raw.trim();
  if (!textTrimmed) {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  // ждём, пока зеркало догоним
  if (localText !== deferredText) {
    lastSelectionRef.current = { s, e, textTrimmed };
    return;
  }

  // Построим range в зеркале по абсолютным индексам textarea
  const { li: sLi, col: sCol } = absToLiCol(fullText, s);
  const { li: eLi, col: eCol } = absToLiCol(fullText, e);
  const sLine = mText.querySelector(`[data-line="${sLi}"]`);
  const eLine = mText.querySelector(`[data-line="${eLi}"]`);
  const sNode = sLine?.firstChild;
  const eNode = eLine?.firstChild;
  if (!sNode || !eNode) {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  const sLen = sNode.textContent?.length ?? 0;
  const eLen = eNode.textContent?.length ?? 0;

  const range = document.createRange();
  try {
    range.setStart(sNode, Math.max(0, Math.min(sCol, sLen)));
    range.setEnd  (eNode, Math.max(0, Math.min(eCol, eLen)));
  } catch {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  const rects = Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0);
  if (!rects.length) {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  // Вычисляем bounding box всего выделения для стабильной центровки
  let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
  for (const rc of rects) {
    minL = Math.min(minL, rc.left);
    minT = Math.min(minT, rc.top);
    maxR = Math.max(maxR, rc.right);
    maxB = Math.max(maxB, rc.bottom);
  }
  if (!isFinite(minL)) {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
    return;
  }

  const stageBox = stage.getBoundingClientRect();
  const scrollLeft = ta.scrollLeft || 0;
  const scrollTop = ta.scrollTop || 0;
  const sbw = getVScrollWidth(ta);

  // Конвертация в координаты внутри stage с учётом скролла
  const leftLocal  = (minL - stageBox.left) - scrollLeft + sbw;
  const rightLocal = (maxR - stageBox.left) - scrollLeft + sbw;
  const topLocal = (minT - stageBox.top) - scrollTop;
  const bottomLocal = (maxB - stageBox.top) - scrollTop;

  // X — по центру bounding box выделения
  const centerX = (leftLocal + rightLocal) / 2;

  // Y — сверху, если хватает места, иначе снизу
  let below = false;
  let y;
  const spaceAbove = topLocal;

  if (spaceAbove >= BUBBLE_MARGIN + BUBBLE_H) {
    y = topLocal - BUBBLE_MARGIN - BUBBLE_H; // над выделением
    below = false;
  } else {
    y = bottomLocal + BUBBLE_MARGIN;         // под выделением
    below = true;
  }

  // Клэмп по краям
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const x = clamp(centerX, BUBBLE_W / 2 + 4, Math.max(BUBBLE_W / 2 + 4, stage.clientWidth  - BUBBLE_W / 2 - 4));
  const clampedY = clamp(y, 0, Math.max(0, stage.clientHeight - BUBBLE_H));

  setSelBubble({ show: true, x, y: clampedY, below, text: textTrimmed, start: s, end: e });
  lastSelectionRef.current = null;
}, [localText, deferredText]);


  const scheduleSelectionBubble = useCallback(() => {
    if (bubbleRafRef.current) cancelAnimationFrame(bubbleRafRef.current);
    bubbleRafRef.current = requestAnimationFrame(() => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = setTimeout(() => {
        recalcSelectionBubbleNow();
      }, 0);
    });
  }, [recalcSelectionBubbleNow]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const hide = () => setSelBubble(b => (b.show ? { ...b, show: false } : b));

    const onMouseUp = () => scheduleSelectionBubble();
    const onKeyUp = (e) => {
      const k = e.key || '';
      if (/^Arrow|Shift|Home|End|Page/.test(k)) scheduleSelectionBubble();
      else hide();
    };
    const onSelect = () => scheduleSelectionBubble();

    ta.addEventListener('mouseup', onMouseUp);
    ta.addEventListener('keyup', onKeyUp);
    ta.addEventListener('select', onSelect);
    ta.addEventListener('scroll', hide, { passive: true });
    ta.addEventListener('blur', hide);

    const onPointerDown = (e) => {
      const el = bubbleRef.current;
      if (el && el.contains(e.target)) return;
      hide();
    };
    const onSelectionChange = () => {
      const s = window.getSelection?.();
      if (!s || s.isCollapsed) hide();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('selectionchange', onSelectionChange);
    const onDocScroll = () => hide();
    document.addEventListener('scroll', onDocScroll, true);

    return () => {
      ta.removeEventListener('mouseup', onMouseUp);
      ta.removeEventListener('keyup', onKeyUp);
      ta.removeEventListener('select', onSelect);
      ta.removeEventListener('scroll', hide);
      ta.removeEventListener('blur', hide);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('scroll', onDocScroll, true);
    };
  }, [scheduleSelectionBubble, localText]);

  useEffect(() => {
    if (localText === deferredText && lastSelectionRef.current) {
      scheduleSelectionBubble();
    }
  }, [deferredText, localText, scheduleSelectionBubble]);

  useEffect(() => {
    return () => {
      if (bubbleRafRef.current) cancelAnimationFrame(bubbleRafRef.current);
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, []);

  const handleAddIdeaFromBubble = () => {
    const t = (selBubble.text || '').trim();
    if (!t) return;
    onAddIdeaFromSelection?.({ text: t, range: { start: selBubble.start, end: selBubble.end } });
    setSelBubble({ show: false, x: 0, y: 0, below: false, text: '', start: null, end: null });

    const ta = textareaRef.current;
    if (ta) {
      const pos = ta.selectionEnd ?? ta.selectionStart ?? 0;
      ta.setSelectionRange(pos, pos);
      ta.focus();
    }
  };

  // highlight range
  useEffect(() => {
    const r = activeHighlight;
    const m = mirrorRef.current;
    const root = mirrorTextRef.current;
    if (!m || !root || !r) { setHlRects([]); return; }
    const txt = deferredText ?? '';
       const start = Math.max(0, Math.min(r.start ?? 0, txt.length));
    const end = Math.max(start, Math.min(r.end ?? 0, txt.length));
    if (end <= start) { setHlRects([]); return; }
    const rects = getClientRectsForRange(start, end, m, root, txt);
    setHlRects(rects);
  }, [activeHighlight, deferredText]);

  const padTop = padTopRef.current;
  const padLeft = padLeftRef.current;
  const padRight = padRightRef.current;
  const contentWidth = textareaRef.current ? textareaRef.current.clientWidth : 0;

  const renderValue = deferredText ?? '';
  const lines = renderValue.split(/\r?\n/);

  const renderRects = rects.map(r => {
    const underlineTop = r.bottom + LINE_GAP;
    const rowCenter = (r.top + r.bottom) / 2;
    const renderLeft = -padLeft;
    const renderFullWidth = Math.max(0, contentWidth - padLeft - padRight);
    return {
      ...r,
      renderLeft,
      renderUnderlineTop: underlineTop - padTop,
      renderDotCenter: rowCenter - padTop,
      renderFullWidth,
      isEmpty: (r.width || 0) < VISIBLE_MIN_WIDTH,
    };
  });

  const hasActive = selected.size === 1;
  const activeIdx = hasActive ? [...selected][0] : null;

  useEffect(() => {
    updateOffscreenIndicators();
  }, [contentWidth, renderRects.length, updateOffscreenIndicators]);

  // ===== 🎤 STT вспомогательные вставки/обработчики =====
  const insertAt = useCallback((pos, chunk) => {
    const src = localText ?? '';
    const p = Math.max(0, Math.min(pos ?? src.length, src.length));
    const next = src.slice(0, p) + (chunk || '') + src.slice(p);
    handleInput(next);
    requestAnimationFrame(() => {
      try {
        textareaRef.current?.focus();
        const end = p + (chunk || '').length;
        textareaRef.current?.setSelectionRange(end, end);
      } catch {}
    });
  }, [localText, handleInput]);

  // пересчитываем позицию спиннера, когда зеркало догоняет ввод
  useEffect(() => { if (sttBusy) recalcSttSpinnerPos(); }, [sttBusy, deferredText, recalcSttSpinnerPos]);

  useEffect(() => {
    if (!sttEvent || !sttEvent.key) return;

    const stamp = `${sttEvent.key}:${sttEvent.phase}`;
    if (sttLastStampRef.current === stamp) return;
    sttLastStampRef.current = stamp;

    if (sttEvent.phase === 'start') {
      const ta = textareaRef.current;
      const pos = (ta?.selectionStart == null) ? (localText?.length ?? 0) : ta.selectionStart;
      sttCaretRef.current = { key: sttEvent.key, pos };
      setSttBusy(true);
      recalcSttSpinnerPos();

      // локальный фьюз: если вдруг «resolve/cancel» не придёт
      if (sttLocalFuseRef.current) clearTimeout(sttLocalFuseRef.current);
      sttLocalFuseRef.current = setTimeout(() => {
        setSttBusy(false);
        setSttSpin(s => (s.show ? { ...s, show: false } : s));
        sttCaretRef.current = null;
      }, 30000);

      return;
    }

    if (sttEvent.phase === 'resolve') {
      if (sttCaretRef.current?.key !== sttEvent.key) return;
      const chunk = (sttEvent.text || '').trim();
      if (chunk) insertAt(sttCaretRef.current.pos, chunk);
      setSttBusy(false);
      setSttSpin(s => (s.show ? { ...s, show: false } : s));
      sttCaretRef.current = null;
      if (sttLocalFuseRef.current) { clearTimeout(sttLocalFuseRef.current); sttLocalFuseRef.current = null; }
      return;
    }

    if (sttEvent.phase === 'cancel') {
      setSttBusy(false);
      setSttSpin(s => (s.show ? { ...s, show: false } : s));
      sttCaretRef.current = null;
      if (sttLocalFuseRef.current) { clearTimeout(sttLocalFuseRef.current); sttLocalFuseRef.current = null; }
    }
  }, [sttEvent, insertAt, recalcSttSpinnerPos, localText]);

  useEffect(() => () => {
    if (sttLocalFuseRef.current) clearTimeout(sttLocalFuseRef.current);
  }, []);

  return (
    <div ref={wrapperRef} className={classes.wrapper}>
      <div ref={stageRef} className={classes.stage}>
        <pre ref={mirrorRef} className={classes.mirror} aria-hidden="true">
          <span ref={mirrorTextRef} className={classes.mirrorText}>
            {lines.map((line, idx) => (
              <span key={idx}>
                <span data-line={idx} className={classes.line}>
                  {line.length ? line : '\u00A0'}
                </span>
                {idx < lines.length - 1 ? '\n' : null}
              </span>
            ))}
          </span>
        </pre>

        {/* подсветки выделений */}
        <div ref={highlightsRef} className={classes.highlights} aria-hidden="true">
          {hlRects.map((r, i) => (
            <div
              key={i}
              className={classes.highlightRect}
              style={{
                top: r.top - padTop,
                left: r.left - padLeft,
                width: r.width,
                height: r.height
              }}
            />
          ))}
        </div>

        <div ref={underlinesRef} className={classes.underlines} aria-hidden="true">
          {renderRects.map(r =>
            (selected.has(r.i)) ? (
              <div
                key={r.i}
                className={classes.underline}
                style={{
                  top: r.renderUnderlineTop,
                  left: r.renderLeft,
                  width: r.renderFullWidth,
                  height: UNDERLINE_H
                }}
              />
            ) : null
          )}
        </div>

        <textarea
          ref={textareaRef}
          className={classes.textArea}
          name="content"
          placeholder="Опишите свою проблему или историю, в которой она произошла..."
          value={localText}
          onChange={(e) => handleInput(e.target.value)}
        />

        {/* 🎤 Спиннер у каретки во время распознавания */}
        {sttSpin.show && (
          <div
            style={{
              position: 'absolute',
              left: sttSpin.x,
              top: sttSpin.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <Spinner size={16} color="#6b7280" />
          </div>
        )}

        {selBubble.show && (
          <div
            ref={bubbleRef}
            className={`${classes.selBubble} ${selBubble.below ? classes.selBubbleBelow : ''}`}
            style={{ left: selBubble.x, top: selBubble.y }}
          >
            <button
              type="button"
              className={classes.selBubbleBtn}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAddIdeaFromBubble}
              title="Добавить идею"
              aria-label="Добавить идею"
            >
              <FcIdea className={classes.selIdeaIcon} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={gutterRef}
        className={classes.gutter}
        role="presentation"
        onMouseMove={(e) => onGutterMove(e)}
        onMouseEnter={(e) => onGutterEnter(e)}
        onMouseLeave={onGutterLeave}
      >
        <button
          ref={topEdgeBtnRef}
          type="button"
          className={`${classes.gutterBtn} ${classes.gutterEdgeBtn} ${classes.gutterEdgeTop}`}
          title="Прокрутить к активной точке выше"
          onClick={onTopEdgeClick}
        >
          <span className={classes.radioDot} />
        </button>
        <button
          ref={bottomEdgeBtnRef}
          type="button"
          className={`${classes.gutterBtn} ${classes.gutterEdgeBtn} ${classes.gutterEdgeBottom}`}
          title="Прокрутить к активной точке ниже"
          onClick={onBottomEdgeClick}
        >
          <span className={classes.radioDot} />
        </button>

        <div ref={gutterInnerRef} className={classes.gutterInner}>
          {renderRects.map(r => {
            if ((renderValue ?? '').trim().length === 0) return null;
            const isHovered = hoverIdx === r.i;
            if (hasActive && r.i !== activeIdx) return null;
            if (!isHovered) return null;

            const isActive = selected.has(r.i);
            const tip = isActive ? 'Удалить точку остановки' : 'Добавить точку остановки';

            return (
              <button
                key={r.i}
                type="button"
                className={`${classes.gutterBtn} ${isActive ? classes.gutterBtnActive : ''}`}
                style={{ top: r.renderDotCenter }}
                title={tip}
                onClick={() => toggle(r.i)}
              >
                <span className={classes.radioDot} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}