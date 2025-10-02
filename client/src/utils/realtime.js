import { jwtDecode } from 'jwt-decode';
import { ACCESS_KEY } from '../http';

const WS_PATH = '/ws';  
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS  = 8000;

let sock = null;
let desiredSubs = new Set();  
let handlers = new Map();     
let reconnectTimer = null;
let started = false;
let reconnectAttempts = 0;

function getAccess() {
  try { return localStorage.getItem(ACCESS_KEY) || ''; } catch { return ''; }
}

function protoFromAccess() {
  const t = getAccess();
  if (!t) return undefined;  
  return `access.${t}`;
}

function openSocket() {
  const proto = protoFromAccess();
  try {
    sock = proto ? new WebSocket(WS_PATH, proto) : new WebSocket(WS_PATH);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  sock.onopen = () => {
    reconnectAttempts = 0;
    for (const ch of desiredSubs) {
      if (ch.startsWith('actor:')) {
        send({ type: 'subscribe.actor' });
      } else if (ch.startsWith('story:')) {
        const id = Number(ch.slice('story:'.length));
        if (Number.isFinite(id)) send({ type: 'subscribe.story', storyId: id });
      }
    }
  };

  sock.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }

    if (typeof msg?.storyId !== 'undefined') {
      const ch = `story:${Number(msg.storyId)}`;
      dispatch(ch, msg);
    }

    if (msg?.type === 'stories.index.patch' || msg?.type?.startsWith('inbox.')) {
      const actorCh = getActorChannel();
      if (actorCh) dispatch(actorCh, msg);
    }
  };

  sock.onclose = () => {
    scheduleReconnect();
  };

  sock.onerror = () => {
  };
}

function send(obj) {
  if (sock && sock.readyState === WebSocket.OPEN) {
    try { sock.send(JSON.stringify(obj)); } catch {}
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectAttempts += 1;
  const delay = Math.min(RECONNECT_BASE_MS * (2 ** (reconnectAttempts - 1)), RECONNECT_MAX_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSocket();
  }, delay);
}

export function startRealtime() {
  if (started) return;
  started = true;

  window.addEventListener('storage', (e) => {
    if (e.key === ACCESS_KEY) {
      try { sock?.close(); } catch {}
    }
  });

  openSocket();
}

export function subscribe(channel, fn) {
  if (!handlers.has(channel)) handlers.set(channel, new Set());
  handlers.get(channel).add(fn);

  if (!desiredSubs.has(channel)) {
    desiredSubs.add(channel);
    if (sock && sock.readyState === WebSocket.OPEN) {
      if (channel.startsWith('actor:')) {
        send({ type: 'subscribe.actor' });
      } else if (channel.startsWith('story:')) {
        const id = Number(channel.slice('story:'.length));
        if (Number.isFinite(id)) send({ type: 'subscribe.story', storyId: id });
      }
    }
  }

  return () => {
    const set = handlers.get(channel);
    if (set) {
      set.delete(fn);
      if (set.size === 0) handlers.delete(channel);
    }
  };
}

function dispatch(channel, msg) {
  const set = handlers.get(channel);
  if (!set || set.size === 0) return;
  for (const fn of set) {
    try { fn(msg); } catch {}
  }
}

export function getActorChannel() {
  const t = getAccess();
  if (!t) return null;
  try {
    const decoded = jwtDecode(t);
    const aid = decoded?.actorId;
    return aid ? `actor:${aid}` : null;
  } catch {
    return null;
  }
}
