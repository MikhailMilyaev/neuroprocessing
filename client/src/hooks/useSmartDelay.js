import { useEffect, useRef, useState } from 'react';

export function useSmartDelay(showRaw, { delayIn = 200, minVisible = 250 } = {}) {
  const [show, setShow] = useState(false);
  const shownAtRef = useRef(0);
  const inT = useRef(null), outT = useRef(null);

  useEffect(() => {
    if (showRaw) {
      clearTimeout(outT.current);
      if (!show) {
        inT.current = setTimeout(() => {
          shownAtRef.current = Date.now();
          setShow(true);
        }, delayIn);
      }
    } else {
      clearTimeout(inT.current);
      if (show) {
        const left = Math.max(0, minVisible - (Date.now() - shownAtRef.current));
        outT.current = setTimeout(() => setShow(false), left);
      } else {
        setShow(false);
      }
    }
    return () => { clearTimeout(inT.current); clearTimeout(outT.current); };
  }, [showRaw, show, delayIn, minVisible]);

  return show;
}
