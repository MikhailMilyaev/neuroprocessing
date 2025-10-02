const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

function createHub(httpServer, opts = {}) {
  const HEARTBEAT_INTERVAL_MS = Number(opts.heartbeatIntervalMs ?? 30_000);
  const PING_PAYLOAD = opts.pingPayload ?? 'hb';

  const wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

  const rooms = new Map();  

  const join = (room, ws) => {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(ws);
    ws._rooms.add(room);
  };

  const leaveAll = (ws) => {
    for (const r of ws._rooms) {
      const set = rooms.get(r);
      set?.delete(ws);
      if (set && set.size === 0) rooms.delete(r);
    }
    ws._rooms.clear();
  };

  function publish(room, payload) {
    const set = rooms.get(room);
    if (!set) return;
    let data;
    try {
      data = JSON.stringify(payload);
    } catch {
      return;
    }
    for (const sock of set) {
      if (sock.readyState === WebSocket.OPEN) {
        try { sock.send(data); } catch {}
      }
    }
  }

  function heartbeatMarkAlive() {
    this.isAlive = true;
  }

  const heartbeatTimer = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        try { ws.terminate(); } catch {}
        continue;
      }
      ws.isAlive = false;
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping(PING_PAYLOAD);
        }
      } catch {}
    }
  }, HEARTBEAT_INTERVAL_MS);

  heartbeatTimer.unref?.();

  wss.on('close', () => {
    clearInterval(heartbeatTimer);
  });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws._rooms = new Set();
    ws.on('pong', heartbeatMarkAlive);

    const url = new URL(req.url, 'http://local');
    const token = extractAccessToken(req, url);

    let payload;
    try {
      payload = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    } catch {
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(4401, 'unauthorized'); } catch {}
        }
      }, 1000);
      return;
    }

    ws.userId = payload.id;
    ws.actorId = payload.actorId || null;

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === 'subscribe.actor' && ws.actorId) {
        join(`actor:${ws.actorId}`, ws);
        join(`inbox:${ws.actorId}`, ws);  
      }

      if (msg.type === 'subscribe.story') {
        const id = Number(msg.storyId);
        if (Number.isFinite(id)) {
          join(`story:${id}`, ws);
        }
      }
    });

    const cleanup = () => {
      leaveAll(ws);
      ws.removeListener('pong', heartbeatMarkAlive);
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);
  });

  function extractAccessToken(req, url) {
    const q = url.searchParams.get('access');
    if (q) return q;

    const proto = req.headers['sec-websocket-protocol'];
    if (proto && typeof proto === 'string') {
      const parts = proto.split(',').map(s => s.trim());
      for (const p of parts) {
        const low = p.toLowerCase();
        if (low.startsWith('bearer ')) return p.slice(7).trim();
        if (p.startsWith('access.'))   return p.slice(7).trim();
        if (p.split('.').length === 3) return p;  
      }
    }

    return '';
  }

  return { publish };
}

module.exports = { createHub };
