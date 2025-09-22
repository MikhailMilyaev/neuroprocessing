const ALLOWED = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowed(url = '') {
  if (!url) return false;
  return ALLOWED.some(o => url.startsWith(o));
}

module.exports = function enforceOrigin(req, res, next) {
  if (process.env.CROSS_SITE !== '1') return next();

  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';

  const ok = (origin && isAllowed(origin)) || (referer && isAllowed(referer));
  if (!ok) {
    return res.status(403).json({ message: 'Forbidden origin' });
  }
  next();
};
