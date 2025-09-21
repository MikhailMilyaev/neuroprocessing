const jwt = require('jsonwebtoken');

module.exports = function (role) {
  return function (req, res, next) {
    if (req.method === 'OPTIONS') return next();

    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (String(scheme || '').toLowerCase() !== 'bearer' || !token) {
      return res.status(401).json({ message: 'Не авторизован.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
      if (decoded.role !== role) {
        return res.status(403).json({ message: 'Нет доступа.' });
      }
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: 'Не авторизован.' });
    }
  };
};
