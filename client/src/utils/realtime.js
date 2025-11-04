// src/utils/realtime.js
import { jwtDecode } from 'jwt-decode';
import { ACCESS_KEY } from '../http';

const WS_PATH = '/ws';
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 8000;

let sock = null;
let desiredSubs = new Set();   // набор желаемых подписок ('actor:<id>', 'story:<id>')
let handlers = new Map();      // Map<channel, Set<fn>>
let reconnectTimer = null;
let started = false;
let reconnectAttempts = 0;

function getAccess() {
  try { return localStorage.getItem(ACCESS_KEY) || ''; } catch { return ''; }
}

function buildWsUrl() {
  const token = getAccess();
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const host  = location.host;
  const base  = `${proto}://${host}${WS_PATH}`;
  return token ? `${base}?access=${encodeURIComponent(token)}` : base;
}

function openSocket() {
  const url = buildWsUrl();

  try {
    sock = new WebSocket(url);
  } catch {
    scheduleReconnect();
    return;
  }

  sock.onopen = () => {
    reconnectAttempts = 0;
    // восстановим подписки
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

    // точечная рассылка по story:<id>
    if (typeof msg?.storyId !== 'undefined') {
      const ch = `story:${Number(msg.storyId)}`;
      dispatch(ch, msg);
    }

    // широковещалка по actor:<actorId>
    const t = msg?.type || '';
    if (t === 'stories.index.patch' || t.startsWith('inbox.') || t.startsWith('practice_runs.')) {
      const actorCh = getActorChannel();
      if (actorCh) dispatch(actorCh, msg);
    }
  };

  sock.onclose = () => {
    scheduleReconnect();
  };

  sock.onerror = () => {
    // намеренно тихо
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

  // если токен обновили в другой вкладке — пересоздаём сокет
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

  // возвращаем отписку
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
