const { URL } = require('url');

const ALLOWED = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => {
    try { return new URL(s).origin; } catch { return null; }
  })
  .filter(Boolean);

function safeOrigin(v) {
  try { return new URL(v).origin; } catch { return ''; }
}

module.exports = function enforceOrigin(req, res, next) {
  if (process.env.CROSS_SITE !== '1') return next();

  const o = safeOrigin(req.headers.origin || '');
  const r = safeOrigin(req.headers.referer || '');

  const fromHeadersOk = (o && ALLOWED.includes(o)) || (r && ALLOWED.includes(r));
  if (fromHeadersOk) return next();

  const scheme = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'));
  const host = req.get('host');
  const reqOrigin = `${scheme}://${host}`;
  if (ALLOWED.includes(reqOrigin)) return next();

  return res.status(403).json({ message: 'Forbidden origin' });
};
