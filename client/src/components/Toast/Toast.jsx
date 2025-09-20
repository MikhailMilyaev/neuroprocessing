import { useEffect, useRef, useState } from 'react';
import { VscError } from 'react-icons/vsc';
import { IoIosInformationCircleOutline } from "react-icons/io";
import s from './Toast.module.css';

export default function Toast({
  message,
  type = 'success',
  duration = 5000,
  version = 0,
  placement = 'bottom',   
  offset = 25,            
  onClose,
}) {
  const [open, setOpen] = useState(Boolean(message));
  const [paused, setPaused] = useState(false);
  const [progressSeed, setProgressSeed] = useState(0);
  const [enterSeed, setEnterSeed] = useState(0);  

  const wasOpenRef = useRef(Boolean(message));
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const remainingRef = useRef(duration);

  useEffect(() => {
    const hasMsg = Boolean(message);

    if (hasMsg) {
      if (!wasOpenRef.current) {
        setOpen(true);
        setEnterSeed(n => n + 1);  
        wasOpenRef.current = true;
      }
      clearTimer();
      remainingRef.current = duration;
      setProgressSeed(n => n + 1);
      if (duration > 0) startTimer();
    } else {
      setOpen(false);
      wasOpenRef.current = false;
      clearTimer();
    }

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration, version]);

  useEffect(() => {
    if (!open && onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => {
    setOpen(false);
    wasOpenRef.current = false;
   }, remainingRef.current);
  };

  const pause = () => {
    if (duration === 0) return;
    setPaused(true);
    if (timerRef.current) {
      const elapsed = Date.now() - startRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      clearTimer();
    }
  };

  const resume = () => {
    if (duration === 0) return;
    setPaused(false);
    if (remainingRef.current > 0) startTimer();
  };

  if (!open) return null;

  const hostCls = [s.host, placement === 'top' ? s.top : s.bottom].join(' ');
  const hostStyle = { '--offset': `${offset}px` };

  const style = duration > 0 ? { '--duration': `${duration}ms` } : undefined;

  const cls = [
    s.toast,
    type === 'error' ? s.error : type === 'info' ? s.info : s.success,
    paused ? s.paused : '',
  ].join(' ');

  return (
    <div className={hostCls} style={hostStyle}>
      <div
        key={enterSeed}            
        className={cls}
        style={style}
        onMouseEnter={pause}
        onMouseLeave={resume}
        role="status"
        aria-live="polite"
      >
        {duration > 0 && <div key={progressSeed} className={s.progress} />}

        <div className={s.leadIcon} aria-hidden="true">
          {type === 'success' && (
            <svg className={s.leadIconSvg} viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {type === 'error' && (
            <VscError className={s.leadIconSvg} size={20} />
          )}
          {type === 'info' && (
            <IoIosInformationCircleOutline className={s.leadIconSvgInfo}/>
          )}
        </div>

        <div className={s.text}>{message}</div>
      </div>
    </div>
  );
}
