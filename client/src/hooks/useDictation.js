import { useRef, useState } from "react";

export function useDictation({ onText, onError } = {}) {
  const [state, setState] = useState("idle"); 
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime});
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setState("uploading");
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");

          const API = process.env.REACT_APP_API_URL || "";
          const resp = await fetch(`${API}/api/stt/transcribe?lang=ru&strict=1`, {
            method: 'POST',
            body: form,
          });

          let data = null;
          try { data = await resp.json(); } catch {}

          if (!resp.ok) {
            const msg = data?.message || `STT failed: ${resp.status}`;
            throw new Error(msg);
          }

          console.log("[STT response]", data);

          const text = (data?.text ?? "").trim();
          if (text) {
            onText?.(text);
          } else {
            onError?.("Ничего не распознано — попробуй говорить чуть дольше/громче");
          }
        } catch (err) {
          console.error(err);
          onError?.(err?.message || "Не удалось расшифровать запись");
        } finally {
          setState("idle");
          // освободим микрофон
          streamRef.current?.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };
      mediaRecRef.current = rec;
      rec.start();
      setState("recording");
    } catch (e) {
      console.error(e);
      onError?.("Нет доступа к микрофону");
      setState("idle");
    }
  }

  function stop() {
    if (mediaRecRef.current && state === "recording") {
      mediaRecRef.current.stop();
      mediaRecRef.current = null;
    }
  }

  async function toggle() {
    if (state === "idle") await start();
    else if (state === "recording") stop();
  }

  return { state, start, stop, toggle };
}
