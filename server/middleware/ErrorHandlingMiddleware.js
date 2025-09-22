const ApiError = require('../error/ApiError');

module.exports = function (err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, requestId: req.id });
  }
  console.error(`[${req.id || '-'}]`, err);
  return res.status(500).json({ message: 'Непредвиденная ошибка', requestId: req.id });
};
