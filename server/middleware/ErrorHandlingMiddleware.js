const ApiError = require('../error/ApiError');

module.exports = function (err, req, res, next) {
  const status = err instanceof ApiError ? err.status : 500;
  const is4xx = status >= 400 && status < 500;

  const body = {};
  body.message = is4xx
    ? (err instanceof ApiError ? err.message : 'Ошибка запроса')
    : 'Внутренняя ошибка сервера';

  if (!(err instanceof ApiError)) {
    console.error(`[${req.id || '-'}]`, err);
  }

  res.status(status).json(body);
};
