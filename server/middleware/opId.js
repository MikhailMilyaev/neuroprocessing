function attachOpId(req, _res, next) {
  const v = req.header('x-op-id');
  req.opId = typeof v === 'string' && v.length ? v : null;
  next();
}
module.exports = { attachOpId };
