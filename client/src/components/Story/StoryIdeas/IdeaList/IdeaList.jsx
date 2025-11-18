import { useEffect, useRef, useState } from 'react';
import IdeaItem from '../IdeaItem/IdeaItem';
import classes from './IdeaList.module.css';
import { PRACTICES } from '../../../../http/practiceApi';

const ANIM_MS = 250;
const archivedFlag = (score) => score !== '' && score != null && Number(score) === 0;

export default function IdeaList({
  visible,
  beliefs,
  showArchive = true,
  reevalRound = 0,
  onTextChange,
  onScoreChange,
  onBlurEmpty,
  practicesById = { __default: PRACTICES },
  initialHydrate = false,
  freezeAnimKey = 0,
}) {
  const lastNonEmptyScoreRef = useRef(new Map());

  const [noAnim, setNoAnim] = useState(!!initialHydrate);
  const firstMountRef = useRef(true);

  const scoreRefs = useRef(new Map());
  const textRefs  = useRef(new Map());
  const registerScoreRef = (id, el) => {
    if (el) scoreRefs.current.set(id, el);
    else scoreRefs.current.delete(id);
  };
  const registerTextRef = (id, el) => {
    if (el) textRefs.current.set(id, el);
    else textRefs.current.delete(id);
  };

  const [leavingToArchive, setLeavingToArchive] = useState(new Set());
  const [leavingFromArchive, setLeavingFromArchive] = useState(new Set());
  const [enteringToActive, setEnteringToActive] = useState(new Set());
  const [enteringToArchive, setEnteringToArchive] = useState(new Set());

  useEffect(() => {
    if (!initialHydrate) return;
    setNoAnim(true);
    let t1 = requestAnimationFrame(() => {
      let t2 = requestAnimationFrame(() => setNoAnim(false));
      t1 = { t1, t2 };
    });
    return () => {
      if (typeof t1 === 'object') {
        cancelAnimationFrame(t1.t1);
        cancelAnimationFrame(t1.t2);
      } else {
        cancelAnimationFrame(t1);
      }
    };
  }, [initialHydrate]);

  useEffect(() => {
    setNoAnim(true);
    let t1 = requestAnimationFrame(() => {
      let t2 = requestAnimationFrame(() => setNoAnim(false));
      t1 = { t1, t2 };
    });
    return () => {
      if (typeof t1 === 'object') {
        cancelAnimationFrame(t1.t1);
        cancelAnimationFrame(t1.t2);
      } else {
        cancelAnimationFrame(t1);
      }
    };
  }, [freezeAnimKey]);

  useEffect(() => {
    const initMap = new Map();
    (beliefs || []).forEach(b => {
      if (b.score !== '' && b.score != null) initMap.set(b.id, b.score);
    });
    lastNonEmptyScoreRef.current = initMap;
    setLeavingToArchive(new Set());
    setLeavingFromArchive(new Set());
    setEnteringToActive(new Set());
    setEnteringToArchive(new Set());
  }, [reevalRound, beliefs]);

  const isArchivedSticky = (b) => {
    const prevMap = lastNonEmptyScoreRef.current;
    const hadPrev = prevMap.has(b.id);
    const wasArch = archivedFlag(prevMap.get(b.id));

    const v = b?.score;
    const hasNow = !(v === '' || v == null);
    const nowArch = hasNow ? archivedFlag(v) : wasArch;

    if (firstMountRef.current || noAnim || !hadPrev) return nowArch;
    if (!hasNow) return false;

    if (nowArch !== wasArch) {
      return nowArch
        ? (leavingToArchive.has(b.id) ? true : false)
        : (leavingFromArchive.has(b.id) ? false : true);
    }
    return nowArch;
  };

  useEffect(() => {
    if (firstMountRef.current) {
      const initMap = new Map();
      (beliefs || []).forEach(b => {
        if (b.score !== '' && b.score != null) initMap.set(b.id, b.score);
      });
      lastNonEmptyScoreRef.current = initMap;
      firstMountRef.current = false;
      return;
    }

    if (noAnim) {
      const initMap = new Map();
      (beliefs || []).forEach(b => {
        if (b.score !== '' && b.score != null) initMap.set(b.id, b.score);
      });
      lastNonEmptyScoreRef.current = initMap;
      setLeavingToArchive(new Set());
      setLeavingFromArchive(new Set());
      setEnteringToActive(new Set());
      setEnteringToArchive(new Set());
      return;
    }

    const prevNonEmpty = lastNonEmptyScoreRef.current;
    const nowMap = new Map((beliefs || []).map(b => [b.id, b.score]));

    const movedToArchive = [];
    const movedToActive  = [];

    (beliefs || []).forEach(b => {
      const id = b.id;
      const wasArch = archivedFlag(prevNonEmpty.get(id));
      const sNow = nowMap.get(id);
      const nowArch = (sNow === '' || sNow == null) ? wasArch : archivedFlag(sNow);
      if (!wasArch && nowArch) movedToArchive.push(id);
      else if (wasArch && !nowArch) movedToActive.push(id);
    });

    if (movedToArchive.length) {
      setLeavingToArchive(s => new Set([...s, ...movedToArchive]));
      setEnteringToArchive(s => new Set([...s, ...movedToArchive]));
      setTimeout(() => {
        setLeavingToArchive(s => { const n = new Set(s); movedToArchive.forEach(id => n.delete(id)); return n; });
        setEnteringToArchive(s => { const n = new Set(s); movedToArchive.forEach(id => n.delete(id)); return n; });
      }, ANIM_MS);
    }

    if (movedToActive.length) {
      setLeavingFromArchive(s => new Set([...s, ...movedToActive]));
      setEnteringToActive(s => new Set([...s, ...movedToActive]));
      setTimeout(() => {
        setLeavingFromArchive(s => { const n = new Set(s); movedToActive.forEach(id => n.delete(id)); return n; });
        setEnteringToActive(s => { const n = new Set(s); movedToActive.forEach(id => n.delete(id)); return n; });
      }, ANIM_MS);
    }

    const nextPrev = new Map(prevNonEmpty);
    for (const k of Array.from(nextPrev.keys())) {
      if (!nowMap.has(k)) nextPrev.delete(k);
    }
    for (const [id, s] of nowMap.entries()) {
      if (s !== '' && s != null) nextPrev.set(id, s);
    }
    lastNonEmptyScoreRef.current = nextPrev;
  }, [beliefs, noAnim]);

  const activeBase   = (beliefs || []).filter(b => !isArchivedSticky(b) || leavingToArchive.has(b.id));
  const archivedBase = (beliefs || []).filter(b =>  isArchivedSticky(b) || leavingFromArchive.has(b.id));

  const bumpFront = (list, idsSet) => {
    if (!idsSet || idsSet.size === 0) return list;
    const leading = list.filter(b => idsSet.has(b.id));
    const rest    = list.filter(b => !idsSet.has(b.id));
    return [...leading, ...rest];
  };

  const active   = noAnim ? activeBase   : bumpFront(activeBase,   enteringToActive);
  const archived = noAnim ? archivedBase : bumpFront(archivedBase, enteringToArchive);

  if (!visible) return null;

  const activeOrder   = active.map(b => b.id);
  const archivedOrder = archived.map(b => b.id);

  const focusNextScore = (fromId, direction = 1) => {
    const idx = activeOrder.indexOf(fromId);
    if (idx === -1) return;
    let i = idx + direction;

    const WAIT_BEFORE_FOCUS = 120;

    while (i >= 0 && i < activeOrder.length) {
      const el = scoreRefs.current.get(activeOrder[i]);
      if (el && !el.disabled) {
        setTimeout(() => {
          try { el.focus(); el.select?.(); } catch {}
        }, WAIT_BEFORE_FOCUS);
        break;
      }
      i += direction;
    }
  };

  const handleScoreFinalized = (id, _value, opts = {}) => {
    const dir = opts.direction === -1 ? -1 : 1;
    focusNextScore(id, dir);
  };

  const focusNextText = (fromId, direction = 1, inArchive = false) => {
    const order = inArchive ? archivedOrder : activeOrder;
    const idx = order.indexOf(fromId);
    if (idx === -1) return;
    const i = idx + direction;
    if (i < 0 || i >= order.length) return;

    const targetId = order[i];
    const el = textRefs.current.get(targetId);
    if (el) {
      try {
        el.focus();
        const len = el.value?.length ?? 0;
        el.setSelectionRange?.(len, len);
      } catch {}
    }
  };

  const handleTextArrow = (id, direction = 1, { inArchive = false } = {}) => {
    focusNextText(id, direction, inArchive);
  };

  return (
    <div className={`${classes.wrap} ${noAnim ? classes.noAnim : ''}`}>
      {active.map(b => (
        <IdeaItem
          key={b.uiKey}
          id={b.id}
          text={b.text}
          score={b.score}
          introducedRound={b.introducedRound ?? 0}
          reevalRound={reevalRound}
          isArchived={false}
          isLeavingActive={leavingToArchive.has(b.id)}
          isReenter={enteringToActive.has(b.id)}
          onTextChange={onTextChange}
          onScoreChange={onScoreChange}
          onBlurEmpty={onBlurEmpty}
          practices={practicesById?.[b.id] ?? practicesById?.__default ?? []}
          registerScoreRef={registerScoreRef}
          onScoreFinalized={handleScoreFinalized}
          registerTextRef={registerTextRef}
          onTextArrow={(id2, dir) => handleTextArrow(id2, dir, { inArchive: false })}
        />
      ))}

      {showArchive && archived.length > 0 && (
        <>
          <div className={classes.archiveHeader}>Архив идей</div>
          {archived.map(b => (
            <IdeaItem
              key={b.uiKey}
              id={b.id}
              text={b.text}
              score={b.score}
              introducedRound={b.introducedRound ?? 0}
              reevalRound={reevalRound}
              isArchived={true}
              isLeavingArchive={leavingFromArchive.has(b.id)}
              isEnteringArchive={enteringToArchive.has(b.id)}
              onTextChange={onTextChange}
              onScoreChange={onScoreChange}
              onBlurEmpty={onBlurEmpty}
              practices={practicesById?.[b.id] ?? practicesById?.__default ?? []}
              registerTextRef={registerTextRef}
              onTextArrow={(id2, dir) => handleTextArrow(id2, dir, { inArchive: true })}
            />
          ))}
        </>
      )}
    </div>
  );
}
