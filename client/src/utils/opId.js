export function genOpId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEN = new Set();
const QUEUE = [];

export function markSentOp(opId) {
  if (!opId) return;
  if (!SEEN.has(opId)) {
    SEEN.add(opId);
    QUEUE.push(opId);
    if (QUEUE.length > 200) {
      const old = QUEUE.shift();
      SEEN.delete(old);
    }
  }
}

export function isOwnOp(opId) {
  return opId && SEEN.has(opId);
}
