import {
  useRef, useState, useEffect, useLayoutEffect, useCallback, useDeferredValue,
} from 'react';
import { FcIdea } from 'react-icons/fc';
import classes from './StoryText.module.css';
import { setStoryStop, clearStoryStop as apiClearStoryStop } from '../../../http/storyApi';

const MIN_H = 120;
const MAX_CAP = 500;
const DEFAULT_VH_RATIO = 0.45;
const UNDERLINE_H = 2;
const LINE_GAP = 1;
const HOVER_SNAP_PX = 10;
const BUBBLE_W = 40;
const BUBBLE_H = 40;
const BUBBLE_MARGIN = 12;
const VISIBLE_PAD = 2;

const computeMaxH = (vhRatio = DEFAULT_VH_RATIO) =>
  Math.max(MIN_H, Math.min(MAX_CAP, Math.round(window.innerHeight * vhRatio)));

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

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
}) {
  const wrapperRef   = useRef(null);
  const stageRef     = useRef(null);
  const editableRef  = useRef(null);
  const overlayRef   = useRef(null);

  const rafRef = useRef(0);
  const isSelectingRef = useRef(false);
  const selFinishTimerRef = useRef(null);

  const [localText, setLocalText] = useState(value ?? '');
  const deferredText = useDeferredValue(localText);
  const [maxH, setMaxH] = useState(() => computeMaxH(vhRatio));
  const [domTick, setDomTick] = useState(0);

  const [selBubble, setSelBubble] = useState({ show: false, x: 0, y: 0, below: false, text: '', start: null, end: null });
  const [hlRects, setHlRects] = useState([]);

  const [guides, setGuides] = useState([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const [gutterHot, setGutterHot] = useState(false);

  const activeUnderRef = useRef(null);
  const initialStopAppliedRef = useRef(false);
  const prevGuidesRef = useRef([]);

  const lastChangeTypeRef = useRef(null);
  const lastCaretBeforeChangeRef = useRef(null);

  const getTextNodes = useCallback((root) => {
    const out = [];
    if (!root) return out;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) out.push(n);
    return out;
  }, []);

  const absFromDOMRange = useCallback((root, rng) => {
    const nodes = getTextNodes(root);
    let acc = 0, start = null, end = null;
    for (const n of nodes) {
      const len = n.nodeValue?.length ?? 0;
      if (start == null && rng.startContainer === n) start = acc + rng.startOffset;
      if (end   == null && rng.endContainer   === n) end   = acc + rng.endOffset;
      acc += len;
    }
    if (start == null) start = 0;
    if (end   == null) end   = acc;
    if (end < start) [start, end] = [end, start];
    return { start, end };
  }, [getTextNodes]);

  const domRangeFromAbs = useCallback((root, absStart, absEnd) => {
    const r = document.createRange();
    if (!root) return r;
    const nodes = getTextNodes(root);
    if (!nodes.length) {
      const tn = document.createTextNode('');
      root.appendChild(tn); nodes.push(tn);
    }
    const totalLen = nodes.reduce((s, n) => s + (n.nodeValue?.length ?? 0), 0);
    const sAbs = clamp(absStart ?? 0, 0, totalLen);
    const eAbs = clamp(absEnd ?? sAbs, 0, totalLen);
    let acc = 0;
    let sNode = nodes[0], sOff = 0;
    let eNode = nodes[nodes.length - 1], eOff = eNode.nodeValue?.length ?? 0;
    for (const n of nodes) {
      const len = n.nodeValue?.length ?? 0;
      if (sAbs >= acc && sAbs <= acc + len) { sNode = n; sOff = Math.max(0, sAbs - acc); }
      if (eAbs >= acc && eAbs <= acc + len) { eNode = n; eOff = Math.max(0, eAbs - acc); break; }
      acc += len;
    }
    try {
      r.setStart(sNode, sOff);
      r.setEnd(eNode, eOff);
    } catch {
      try {
        r.setStart(nodes[0], 0);
        const last = nodes[nodes.length - 1];
        r.setEnd(last, last.nodeValue?.length ?? 0);
      } catch {}
    }
    return r;
  }, [getTextNodes]);

  const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const snapPx = (v) => Math.round(v * DPR) / DPR;

  const recomputeGuides = useCallback(() => {
    const pre = editableRef.current;
    const stage = stageRef.current;
    if (!pre || !stage) { setGuides([]); return; }
    const stRect = stage.getBoundingClientRect();
    const sTop = stage.scrollTop || 0;

    const cs = getComputedStyle(pre);
    const lineHpx = (() => {
      const lh = cs.lineHeight || '';
      if (lh.endsWith('px')) return parseFloat(lh) || 20;
      const fs = parseFloat(cs.fontSize) || 16;
      return fs * (parseFloat(lh) || 1.6);
    })();

    const nodes = getTextNodes(pre);
    const pooled = [];
    for (const n of nodes) {
      const r = document.createRange();
      try { r.selectNodeContents(n); } catch { continue; }
      const rects = Array.from(r.getClientRects()).filter(rc => rc.width > 2 && rc.height > 0);
      if (rects.length) {
        for (const rc of rects) {
          pooled.push({
            top: Math.round(rc.top - stRect.top + sTop),
            bottom: Math.round(rc.bottom - stRect.top + sTop),
          });
        }
      } else {                                     
        const top = Math.round((n.parentElement?.offsetTop || 0) - stRect.top + sTop);
        pooled.push({ top, bottom: top + lineHpx });
      }
    }
    if (!pooled.length) { setGuides([]); return; }
    pooled.sort((a, b) => a.top - b.top);
    const out = [];
    let lastMid = null;
    for (const rc of pooled) {
      const mid   = Math.round((rc.top + rc.bottom) / 2);
      const under = Math.round(rc.bottom - UNDERLINE_H);
      if (lastMid == null || Math.abs(lastMid - mid) > 1) {
        out.push({ top: rc.top, bottom: rc.bottom, mid, under });
        lastMid = mid;
      }
    }
    setGuides(out);
  }, [getTextNodes]);

  const isCEEmpty = useCallback((s) => {
    if (!s) return true;
    const cleaned = String(s)
      .replace(/\u00A0/g, ' ')
      .replace(/\u200B/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
    return cleaned.length === 0;
  }, []);

  useEffect(() => {
    const onResize = () => setMaxH(computeMaxH(vhRatio));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [vhRatio]);

  useEffect(() => { setLocalText(value ?? ''); }, [value]);

  const lastAppliedValueRef = useRef(null);
  useLayoutEffect(() => {
    const pre = editableRef.current;
    if (!pre) return;
    const next = value ?? '';
    if (pre.textContent !== next) pre.textContent = next;
    lastAppliedValueRef.current = next;
    pre.setAttribute('data-empty', isCEEmpty(next) ? 'true' : 'false');
  }, [value, isCEEmpty]);

  useLayoutEffect(() => {
    const pre   = editableRef.current;
    const stage = stageRef.current;
    if (!pre || !stage) return;
    const cs = getComputedStyle(pre);
    const lineHpx = (() => {
      const lh = cs.lineHeight || '';
      if (lh.endsWith('px')) return parseFloat(lh) || 0;
      const fs = parseFloat(cs.fontSize) || 16;
      const factor = parseFloat(lh) || 1.6;
      return fs * factor;
    })();
    const text = (pre.textContent ?? localText ?? '').replace(/\r\n/g, '\n');
    const last = pre.lastChild;
    const hasTrailingBr =
      last &&
      last.nodeType === 1 &&
      (last.nodeName === 'BR' ||
        (/^(DIV|P)$/i.test(last.nodeName) &&
          last.childNodes.length === 1 &&
          last.firstChild?.nodeName === 'BR'));
    const correction = (hasTrailingBr && text.endsWith('\n')) ? lineHpx : 0;
    const naturalEstimate = Math.ceil(pre.scrollHeight - correction);
    const nextH = clamp(naturalEstimate, MIN_H, maxH);
    stage.style.height    = `${nextH}px`;
    stage.style.overflowY = naturalEstimate > maxH ? 'auto' : 'hidden';
    stage.style.overflowX = 'hidden';
    stage.style.setProperty('overflow-anchor', 'none');
    const t = requestAnimationFrame(() => recomputeGuides());
    return () => cancelAnimationFrame(t);
  }, [localText, maxH, recomputeGuides, domTick]);

  const flushTimerRef = useRef(null);
  const handleInput = useCallback((txt) => {
    setLocalText(txt);
    lastAppliedValueRef.current = txt;
    const pre = editableRef.current;
    if (pre) pre.setAttribute('data-empty', isCEEmpty(txt) ? 'true' : 'false');
    setDomTick(t => t + 1);
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => onChange?.(txt), 90);
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
  }, [onChange, isCEEmpty]);

  const saveStop = useCallback(async (contentY) => {
    if (!storyId || contentY == null) return;
    try { await setStoryStop(storyId, Math.round(contentY)); }
    catch (e) { console.error(e); }
  }, [storyId]);

  const clearStop = useCallback(async () => {
    if (!storyId) return;
    try { await apiClearStoryStop(storyId); }
    catch (e) { console.error(e); }
  }, [storyId]);

  const removeActiveStop = useCallback(() => {
    activeUnderRef.current = null;
    setActiveIdx(null);
    clearStop();
    onStopChange?.(null);
  }, [clearStop, onStopChange]);

  const toggleStop = useCallback((idx) => {
    if (idx == null) return;
    if (activeIdx === idx) {
      activeUnderRef.current = null;
      setActiveIdx(null);
      clearStop();
      onStopChange?.(null);
    } else {
      setActiveIdx(idx);
      const y = guides[idx]?.under ?? null;
      if (y != null) {
        activeUnderRef.current = y;
        saveStop(y);
        onStopChange?.(y);
      }
    }
  }, [activeIdx, guides, clearStop, saveStop, onStopChange]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || initialViewContentY == null) return;
    const t = requestAnimationFrame(() => {
      const next = clamp(initialViewContentY, 0, Math.max(0, stage.scrollHeight - stage.clientHeight));
      stage.scrollTop = next;
    });
    return () => cancelAnimationFrame(t);
  }, [initialViewContentY]);

  useEffect(() => {
    if (initialStopAppliedRef.current) return;
    if (initialStopContentY == null) return;
    if (!guides.length) return;
    let idx = null, best = Infinity;
    guides.forEach((g, i) => {
      const d = Math.abs(g.under - initialStopContentY);
      if (d < best) { best = d; idx = i; }
    });
    if (best <= HOVER_SNAP_PX && idx != null) {
      setActiveIdx(idx);
      activeUnderRef.current = guides[idx].under;
    }
    initialStopAppliedRef.current = true;
  }, [initialStopContentY, guides]);

  useEffect(() => {
    if (!guides.length) {
      if (activeIdx != null) {
        activeUnderRef.current = null;
        setActiveIdx(null);
        onStopChange?.(null);
        clearStop();
      }
      prevGuidesRef.current = [];
      return;
    }

    if (activeIdx != null && guides[activeIdx]) {
      activeUnderRef.current = guides[activeIdx].under;
      prevGuidesRef.current = guides;
      return;
    }

    let newIdx = guides.findIndex(g => Math.abs(g.under - (activeUnderRef.current ?? -1)) < 1);
    if (newIdx !== -1) {
      setActiveIdx(newIdx);
      activeUnderRef.current = guides[newIdx].under;
      prevGuidesRef.current  = guides;
      return;
    }

    const anchor = prevGuidesRef.current[activeIdx]?.under ?? activeUnderRef.current;
    if (anchor == null) {
      prevGuidesRef.current = guides;
      return;
    }
    let candidates = [];
    let minDist    = Infinity;
    for (let i = 0; i < guides.length; i++) {
      const g = guides[i];
      const d = Math.abs(g.under - anchor);
      if (g.under <= anchor + 1 && d < minDist) {    
        minDist = d;
        candidates = [i];
      } else if (g.under <= anchor + 1 && d === minDist) {
        candidates.push(i);
      }
    }
    if (!candidates.length) {
      setActiveIdx(null);
      activeUnderRef.current = null;
      onStopChange?.(null);
      clearStop();
    } else {
      candidates.sort((a, b) => guides[b].under - guides[a].under);  
      const idx = candidates[0];
      setActiveIdx(idx);
      activeUnderRef.current = guides[idx].under;
      saveStop(guides[idx].under);
      onStopChange?.(guides[idx].under);
    }
    lastChangeTypeRef.current = null;
    prevGuidesRef.current = guides;
  }, [guides, activeIdx, clearStop, onStopChange, saveStop]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onScroll = () => { recomputeGuides(); onViewYChange?.(stage.scrollTop); };
    const onResize = () => recomputeGuides();
    stage.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => recomputeGuides());
    ro.observe(stage);
    const pre = editableRef.current;
    if (pre) ro.observe(pre);
    return () => {
      stage.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [recomputeGuides, onViewYChange]);

  const hideSelBubble = useCallback(() => {
    setSelBubble(b => (b.show ? { ...b, show: false } : b));
  }, []);

  const selectionIsInsideEditable = useCallback(() => {
    const pre = editableRef.current;
    const sel = window.getSelection?.();
    if (!pre || !sel || sel.rangeCount === 0) return false;
    const { anchorNode, focusNode } = sel;
    return pre.contains(anchorNode) && pre.contains(focusNode);
  }, []);

  const recalcSelectionBubbleNow = useCallback(() => {
    const pre = editableRef.current;
    const stage = stageRef.current;
    if (!pre || !stage) return hideSelBubble();
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return hideSelBubble();
    if (!selectionIsInsideEditable()) return hideSelBubble();
    const r = sel.getRangeAt(0);
    if (r.collapsed) return hideSelBubble();
    const raw = r.toString().trim();
    if (!raw) return hideSelBubble();
    const { start: absStart, end: absEnd } = absFromDOMRange(pre, r);
    const rects = Array.from(r.getClientRects()).filter(rc => rc.width > 0 && rc.height > 0);
    if (!rects.length) return hideSelBubble();
    const leftWin   = Math.min(...rects.map(rc => rc.left));
    const rightWin  = Math.max(...rects.map(rc => rc.right));
    const topWin    = Math.min(...rects.map(rc => rc.top));
    const bottomWin = Math.max(...rects.map(rc => rc.bottom));
    const stRect = stage.getBoundingClientRect();
    const sTop = stageRef.current?.scrollTop || 0;
    const sLeft = stage.scrollLeft || 0;
    const centerXContent = (leftWin + rightWin) / 2 - stRect.left + sLeft;
    const topContent     =  topWin    - stRect.top  + sTop;
    const bottomContent  =  bottomWin - stRect.top  + sTop;
    const xMin = sLeft + BUBBLE_W / 2 + 4;
    const xMax = sLeft + stage.clientWidth - BUBBLE_W / 2 - 4;
    const x = clamp(centerXContent, xMin, xMax);
    const placeAbove = (topContent - sTop) >= (BUBBLE_MARGIN + BUBBLE_H);
    const y = placeAbove ? (topContent - BUBBLE_MARGIN) : (bottomContent + BUBBLE_MARGIN);
    setSelBubble({ show: true, x, y, below: !placeAbove, text: raw, start: absStart, end: absEnd });
  }, [hideSelBubble, selectionIsInsideEditable, absFromDOMRange]);

  const recalcSelectionBubbleSoon = useCallback(() => {
    if (!selBubble.show) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { recalcSelectionBubbleNow(); rafRef.current = 0; });
  }, [selBubble.show, recalcSelectionBubbleNow]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onResize = () => recalcSelectionBubbleSoon();
    const onSelChange = () => {
      if (isSelectingRef.current) return;
      if (selFinishTimerRef.current) clearTimeout(selFinishTimerRef.current);
      selFinishTimerRef.current = setTimeout(() => recalcSelectionBubbleNow(), 120);
    };
    const onPointerUp = () => {
      if (selFinishTimerRef.current) { clearTimeout(selFinishTimerRef.current); selFinishTimerRef.current = null; }
      if (isSelectingRef.current) isSelectingRef.current = false;
      recalcSelectionBubbleNow();
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('selectionchange', onSelChange);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp, { passive: true });
    const ro = new ResizeObserver(() => recalcSelectionBubbleSoon());
    ro.observe(stage);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('selectionchange', onSelChange);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (selFinishTimerRef.current) clearTimeout(selFinishTimerRef.current);
    };
  }, [recalcSelectionBubbleSoon, recalcSelectionBubbleNow]);

  useEffect(() => {
    const root = editableRef.current;
    const h = activeHighlight;
    if (!root || !h || typeof h.start !== 'number' || typeof h.end !== 'number') {
      setHlRects([]); return;
    }
    const txtTotal = root.textContent?.length ?? 0;
    const s = Math.max(0, Math.min(h.start, txtTotal));
    const e = Math.max(s, Math.min(h.end,   txtTotal));
    if (e <= s) { setHlRects([]); return; }
    const r = domRangeFromAbs(root, s, e);
    const base = root.getBoundingClientRect();
    const rcList = Array.from(r.getClientRects()).map(rc => ({
      top: rc.top - base.top,
      left: rc.left - base.left,
      width: rc.width,
      height: rc.height,
    }));
    setHlRects(rcList);
  }, [activeHighlight, deferredText, domRangeFromAbs]);

  const snapToIdx = useCallback((y, { requireFullyVisible = true } = {}) => {
    if (!guides.length) return null;
    const stage = stageRef.current;
    const sTop = stage?.scrollTop || 0;
    const viewportH = stage?.clientHeight || 0;
    const MARGIN = 3;
    let bestI = null;
    let bestDist = Infinity;
    for (let i = 0; i < guides.length; i++) {
      const g = guides[i];
      const topV = g.top - sTop;
      const botV = g.bottom - sTop;
      const fullyVisible = topV >= VISIBLE_PAD && botV <= (viewportH - VISIBLE_PAD);
      if (requireFullyVisible && !fullyVisible) continue;
      if (y >= topV - MARGIN && y <= botV + MARGIN) {
        const d = Math.abs(((topV + botV) / 2) - y);
        if (d < bestDist) { bestDist = d; bestI = i; }
      }
    }
    return bestI;
  }, [guides]);

  const handleGutterHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const yLocal = e.clientY - rect.top;
    const idx = snapToIdx(yLocal, { requireFullyVisible: true });
    setHoverIdx(idx);
  };
  const clearHover = () => setHoverIdx(null);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = overlayRef.current;
    if (!stage || !layer) return;
    const sync = () => { if (selBubble.show) recalcSelectionBubbleSoon(); };
    sync();
    stage.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      stage.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [selBubble.show, recalcSelectionBubbleSoon]);

  const getCaretAbsIndexOrNull = useCallback(() => {
    const pre = editableRef.current;
    const sel = window.getSelection?.();
    if (!pre || !sel || sel.rangeCount === 0) return null;
    if (!selectionIsInsideEditable()) return null;
    const r = sel.getRangeAt(0);
    if (!r.collapsed) return null;
    const { start } = absFromDOMRange(pre, r);
    return start;
  }, [selectionIsInsideEditable, absFromDOMRange]);

  useEffect(() => {
    const t = requestAnimationFrame(() => onReady?.());
    return () => cancelAnimationFrame(t);
  }, [onReady]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const caretAbs = getCaretAbsIndexOrNull();
      if (caretAbs == null) return;
      const text = editableRef.current?.textContent ?? '';
      const sel = window.getSelection?.();
      if (!sel || sel.rangeCount === 0) return;
      const r = sel.getRangeAt(0);
      if (!r.collapsed) return;
      if (e.key === 'Backspace') {
        const atStartOfLine = (caretAbs === 0 || text.charAt(caretAbs - 1) === '\n');
        if (!atStartOfLine) {
          lastChangeTypeRef.current = 'delete-backward-at-end';
          lastCaretBeforeChangeRef.current = caretAbs;
          return;
        }
        if (caretAbs === 0) {
          lastChangeTypeRef.current = 'delete-backward-at-start';
          lastCaretBeforeChangeRef.current = caretAbs;
          return;
        }
        let prevStart = caretAbs - 2;
        while (prevStart >= 0 && text.charAt(prevStart) !== '\n') prevStart--;
        prevStart += 1;
        const prevContent = text.slice(prevStart, caretAbs - 1);
        lastChangeTypeRef.current = isCEEmpty(prevContent) ? 'delete-empty-above' : 'delete-backward-at-start';
        lastCaretBeforeChangeRef.current = caretAbs;
      } else if (e.key === 'Delete') {
        const atEndOfLine = (caretAbs === text.length || text.charAt(caretAbs) === '\n');
        if (!atEndOfLine) {
          lastChangeTypeRef.current = 'delete-forward-at-start';
          lastCaretBeforeChangeRef.current = caretAbs;
          return;
        }
        if (caretAbs === text.length) {
          lastChangeTypeRef.current = 'delete-forward-at-end';
          lastCaretBeforeChangeRef.current = caretAbs;
          return;
        }
        let nextEnd = caretAbs + 1;
        while (nextEnd < text.length && text.charAt(nextEnd) !== '\n') nextEnd++;
        const nextContent = text.slice(caretAbs + 1, nextEnd);
        lastChangeTypeRef.current = isCEEmpty(nextContent) ? 'delete-empty-below' : 'delete-forward-at-end';
        lastCaretBeforeChangeRef.current = caretAbs;
      }
    } else {
      lastChangeTypeRef.current = null;
      lastCaretBeforeChangeRef.current = null;
    }
  }, [getCaretAbsIndexOrNull, isCEEmpty]);

  useEffect(() => {
    const editable = editableRef.current;
    if (!editable) return;
    editable.addEventListener('keydown', handleKeyDown);
    return () => editable.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const sTop = stageRef.current?.scrollTop || 0;
  const activeUnderlineY =
    (activeIdx != null && guides[activeIdx]) ? guides[activeIdx].under : null;
  const activeDotY =
    (activeIdx != null && guides[activeIdx]) ? (guides[activeIdx].mid - sTop) : null;
  const hoverDotY =
    (hoverIdx != null && guides[hoverIdx]) ? (guides[hoverIdx].mid - sTop) : null;
  const viewportH = stageRef.current?.clientHeight || 0;
  const sBottom   = sTop + viewportH;
  const activeMidContentY =
    (activeIdx != null && guides[activeIdx]) ? guides[activeIdx].mid : null;
  const activeAbove = activeMidContentY != null && activeMidContentY < sTop;
  const activeBelow = activeMidContentY != null && activeMidContentY > sBottom;

  const scrollToActiveStop = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || activeIdx == null) return;
    const g = guides[activeIdx];
    if (!g) return;
    const target = clamp(
      Math.round(g.mid - stage.clientHeight * 0.4),
      0,
      Math.max(0, stage.scrollHeight - stage.clientHeight)
    );
    stage.scrollTo({ top: target, behavior: 'smooth' });
  }, [activeIdx, guides]);

  const showActiveDot = gutterHot && activeIdx != null && hoverIdx === activeIdx;
  const showHoverDot  = gutterHot && activeIdx == null && hoverIdx != null;

  return (
    <div ref={wrapperRef} className={classes.wrapper}>
      <div ref={stageRef} className={classes.stage}>
        <div className={classes.highlights} aria-hidden="true">
          {hlRects.map((r, i) => (
            <div key={i} className={classes.highlightRect}
              style={{ top: r.top, left: r.left, width: r.width, height: r.height }} />
          ))}
        </div>

        <div className={classes.underlines} aria-hidden="true">
          {activeUnderlineY != null && (
            <div
              className={classes.underline}
              style={{
                top: snapPx(activeUnderlineY + LINE_GAP),
                left: 0, right: 0, height: UNDERLINE_H
              }}
            />
          )}
        </div>

        <pre
          ref={editableRef}
          className={classes.editable}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck
          data-placeholder="Опишите свою проблему или историю, в которой она произошла..."
          data-empty={isCEEmpty(localText) ? 'true' : 'false'}
          onInput={(e) => handleInput(e.currentTarget.textContent ?? '')}
          onPointerDown={() => { isSelectingRef.current = true; setSelBubble(b => ({ ...b, show: false })); }}
        />

        <div ref={overlayRef} className={classes.scrollOverlay}>
          {selBubble.show && (
            <div
              className={`${classes.selBubble} ${selBubble.below ? classes.selBubbleBelow : ''}`}
              style={{ left: selBubble.x, top: selBubble.y }}>
              <button
                type="button"
                className={classes.selBubbleBtn}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const t = (selBubble.text || '').trim();
                  if (!t) return;
                  onAddIdeaFromSelection?.({
                    text: t,
                    range: { start: selBubble.start, end: selBubble.end }
                  });
                }}
                title="Добавить идею" aria-label="Добавить идею">
                <FcIdea className={classes.selIdeaIcon} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={classes.gutter}
        role="presentation"
        onMouseEnter={() => setGutterHot(true)}
        onMouseLeave={() => { setGutterHot(false); clearHover(); }}
        onMouseMove={handleGutterHover}
      >
        <div className={classes.gutterInner}>
          {showActiveDot && activeDotY != null && (
            <button
              type="button"
              className={`${classes.gutterBtn} ${classes.gutterBtnActive}`}
              style={{ top: activeDotY }}
              aria-pressed="true"
              onClick={removeActiveStop}
              title="Удалить точку остановки"
            >
              <span className={classes.radioDot} />
            </button>
          )}

          {activeAbove && (
            <button
              type="button"
              className={`${classes.gutterBtn} ${classes.gutterBtnActive} ${classes.gutterEdgeTop}`}
              onClick={scrollToActiveStop}
              aria-pressed="true"
              title="Перейти к точке остановки (выше)"
            >
              <span className={classes.radioDot} />
            </button>
          )}

          {activeBelow && (
            <button
              type="button"
              className={`${classes.gutterBtn} ${classes.gutterBtnActive} ${classes.gutterEdgeBottom}`}
              onClick={scrollToActiveStop}
              aria-pressed="true"
              title="Перейти к точке остановки (ниже)"
            >
              <span className={classes.radioDot} />
            </button>
          )}

          {showHoverDot && hoverDotY != null && (
            <button
              type="button"
              className={classes.gutterBtn}
              style={{ top: hoverDotY }}
              aria-pressed="false"
              onClick={() => toggleStop(hoverIdx)}
              title="Добавить точку остановки"
            >
              <span className={classes.radioDot} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}