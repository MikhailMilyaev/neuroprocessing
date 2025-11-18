import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import classes from "./StoryModal.module.css";
import { MdDeleteOutline, MdEdit } from "react-icons/md";

const StoryModal = ({
  open,
  position,
  onClose,
  onDelete,
  onEdit,                 
  mobile = false,
  anchorRect = null,       
  overlayMeta = null,      
  onMobileEditSubmit,      
  forceMobileEdit = false  
}) => {
  const popRef = useRef(null);
  const ghostRef = useRef(null);
  const inputRef = useRef(null);

  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [ready, setReady] = useState(false);

  const [mobileEditing, setMobileEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const closeSafely = () => {
    try { window.__storiesSuppressTapUntil = performance.now() + 700; } catch {}
    requestAnimationFrame(() => onClose?.());
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const pop = popRef.current;
      const ghost = ghostRef.current;
      const t = e.target;
      const inPop = pop && pop.contains(t);
      const inGhost = mobile && ghost && ghost.contains(t);
      if (!inPop && !inGhost) {
        if (mobile && mobileEditing) {
          const val = (editValue || "").trim();
          if (val) onMobileEditSubmit?.(val);
        }
        closeSafely();
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
    };
  }, [open, mobile, mobileEditing, editValue, onMobileEditSubmit]);

  useEffect(() => {
    if (!open || !mobile) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOv = html.style.overflow;
    const prevBodyOv = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.classList.add("stories-modal-lock");
    html.classList.add(classes.noSelect);
    body.classList.add(classes.noSelect);
    return () => {
      setTimeout(() => html.classList.remove("stories-modal-lock"), 120);
      html.style.overflow = prevHtmlOv;
      body.style.overflow = prevBodyOv;
      html.classList.remove(classes.noSelect);
      body.classList.remove(classes.noSelect);
    };
  }, [open, mobile]);

  useEffect(() => {
  if (!mobile || !open) return;

  const onForce = () => {
    const el = inputRef.current;
    if (!el) return;
    setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { el.focus(); }
      try { el.click(); } catch {}
      try {
        const len = el.value?.length ?? 0;
        el.setSelectionRange(len, len);
      } catch {}
      try { document.dispatchEvent(new Event("stories:mobile-input-focused")); } catch {}
    }, 30);
  };

  document.addEventListener("stories:force-focus-create", onForce);
  return () => document.removeEventListener("stories:force-focus-create", onForce);
}, [mobile, open]);


  useEffect(() => {
    if (!open) return;
    setReady(false);
    const el = popRef.current;
    if (!el) return;
    const pad = 8;

    if (!mobile) {
      let x = position?.x ?? pad;
      let y = position?.y ?? pad;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (x + r.width > window.innerWidth - pad) x = window.innerWidth - r.width - pad;
        if (y + r.height > window.innerHeight - pad) y = window.innerHeight - r.height - pad;
        if (x < pad) x = pad;
        if (y < pad) y = pad;
        setPos({ x, y });
        setReady(true);
      });
      return;
    }

    if (!forceMobileEdit) {
      const a = anchorRect;
      if (!a) return;
      let x = Math.min(a.left + a.width - 260, window.innerWidth - 260 - pad);
      if (x < pad) x = pad;
      el.style.left = `${x}px`;
      el.style.top = `-9999px`;

      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - (a.top + a.height);
        const spaceAbove = a.top;
        let y;
        if (spaceBelow < r.height + 12 && spaceAbove >= r.height + 12) {
          y = Math.max(a.top - r.height - 12, pad);
        } else {
          y = Math.min(a.top + a.height + 12, window.innerHeight - r.height - pad);
        }
        setPos({ x, y });
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, [open, mobile, position, anchorRect, forceMobileEdit]);

  const computeEditTop = () => {
    const vvTop = (window.visualViewport && Number.isFinite(window.visualViewport.offsetTop))
      ? window.visualViewport.offsetTop
      : 0;
    return Math.max(16, vvTop + 48);
  };
  const [editTop, setEditTop] = useState(computeEditTop());

  useEffect(() => {
    if (!open || !mobile || !mobileEditing) return;
    setEditTop(computeEditTop());
    const onVV = () => setEditTop(computeEditTop());
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onVV);
      window.visualViewport.addEventListener("scroll", onVV);
    }
    const t = setTimeout(() => setEditTop(computeEditTop()), 60);
    return () => {
      clearTimeout(t);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onVV);
        window.visualViewport.removeEventListener("scroll", onVV);
      }
    };
  }, [open, mobile, mobileEditing]);

  useEffect(() => {
    if (!mobile || !open) return;
    if (forceMobileEdit) setMobileEditing(true);
  }, [mobile, open, forceMobileEdit]);

  useEffect(() => {
    if (!mobile || !open || !mobileEditing) return;
    setEditValue(overlayMeta?.isPlaceholder ? "" : (overlayMeta?.title || ""));
    const focusSoon = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (!el) return;
          try { el.focus({ preventScroll: true }); } catch { el.focus(); }
          try { el.click(); } catch {}
          const len = el.value?.length ?? 0;
          try { el.setSelectionRange(len, len); } catch {}
          try { document.dispatchEvent(new Event("stories:mobile-input-focused")); } catch {}
          setTimeout(() => {
            if (document.activeElement !== el) {
              try { el.focus({ preventScroll: true }); } catch { el.focus(); }
              try { el.click(); } catch {}
            }
          }, 60);
        });
      });
    };
    focusSoon();
    if ("visualViewport" in window && window.visualViewport) {
      const once = () => { setTimeout(focusSoon, 30); window.visualViewport.removeEventListener("resize", once); };
      window.visualViewport.addEventListener("resize", once, { once: true });
    }
  }, [mobile, open, mobileEditing, overlayMeta]);

  if (!open) return null;

  const onClickEditDesktop = (e) => {
    e.preventDefault(); e.stopPropagation();
    onEdit?.(); 
  };

  const onClickEditMobile = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!mobile) return;
    setMobileEditing(true);
  };

  const onSubmitMobile = () => {
    const val = (editValue || "").trim();
    if (val) onMobileEditSubmit?.(val);
    closeSafely();
  };

  const onCancelMobile = () => {
    const val = (editValue || "").trim();
    if (val) onMobileEditSubmit?.(val);
    closeSafely();
  };

  const content = (
    <div
      ref={popRef}
      className={`${classes.pop} ${mobile ? classes.popMobile : ""} ${ready ? classes.ready : classes.hidden}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        className={classes.item}
        onClick={mobile ? onClickEditMobile : onClickEditDesktop}
        role="menuitem"
      >
        <MdEdit className={classes.icon} />
        <span className={classes.label}>Изменить</span>
      </button>
      <div className={classes.sep} />
      <button
        className={classes.item}
        onClick={(e)=>{e.preventDefault(); e.stopPropagation(); onDelete?.();}}
        role="menuitem"
      >
        <MdDeleteOutline className={classes.iconDanger} />
        <span className={classes.labelDanger}>Удалить</span>
      </button>
    </div>
  );

  const ghostStyle = mobileEditing
    ? { left: undefined, top: `${Math.round(editTop)}px`, width: undefined, height: undefined }
    : anchorRect
      ? {
          left: `${Math.max(0, anchorRect.left)}px`,
          top: `${Math.max(0, anchorRect.top)}px`,
          width: `${anchorRect.width}px`,
          height: `${anchorRect.height}px`,
        }
      : undefined;

  return createPortal(
    <>
      {mobile && (
        <>
          <div
            className={classes.backdrop}
            aria-hidden
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelMobile(); }}
          />
          <div
            ref={ghostRef}
            className={`${classes.selectedGhost} ${mobileEditing ? classes.ghostEditing : ""}`}
            style={ghostStyle}
            aria-hidden={false}
            onTouchStart={(e) => { if (!mobileEditing) { e.preventDefault(); e.stopPropagation(); } }}
            onMouseDown={(e) => { if (!mobileEditing) { e.preventDefault(); e.stopPropagation(); } }}
            onClick={(e) => { if (!mobileEditing) { e.preventDefault(); e.stopPropagation(); } }}
          >
            {!mobileEditing ? (
              <>
                <span
                  className={`${classes.ghostTitle} ${overlayMeta?.isPlaceholder ? classes.ghostTitlePlaceholder : ""}`}
                  title={overlayMeta?.title || ""}
                >
                  {overlayMeta?.title || ""}
                </span>
                {!!(overlayMeta?.time) && (
                  <span className={classes.ghostTime}>{overlayMeta.time}</span>
                )}
              </>
            ) : (
              <div className={classes.editWrap}>
                <input
                  ref={inputRef}
                  className={classes.editInput}
                  type="text"
                  inputMode="text"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  enterKeyHint="done"
                  placeholder="Сформулируйте проблему"
                  value={editValue}
                  onChange={(e)=>setEditValue(e.target.value)}
                  onKeyDown={(e)=>{ if (e.key === "Enter") { e.preventDefault(); onSubmitMobile(); } }}
                  onBlur={onSubmitMobile}
                  aria-label="Редактирование заголовка истории"
                  autoFocus
                />
              </div>
            )}
          </div>
        </>
      )}

      {(!mobile || (!mobileEditing && !forceMobileEdit)) && content}
    </>,
    document.getElementById("storyModal")
  );
};

export default StoryModal;