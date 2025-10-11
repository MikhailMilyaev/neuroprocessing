const { body, param, query } = require('express-validator');

// ===== utils: нормализация RU-телефона на бэке =====
function normalizeRuPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!/^[78]\d{10}$/.test(digits)) return null;
  return '+7' + digits.slice(1); // E.164
}

exports.email = body('email').isEmail().normalizeEmail();
exports.password = body('password').isString().isLength({ min: 8, max: 200 });
exports.newPassword = body('newPassword').isString().isLength({ min: 8, max: 200 });

exports.name = body('name').optional().isString().isLength({ min: 1, max: 100 });

exports.storyIdParam = param('storyId').isInt({ min: 1 }).toInt();
exports.idParam = param('id').isInt({ min: 1 }).toInt();
exports.text = body('text').optional().isString().isLength({ min: 0, max: 20000 });
exports.score = body('score').optional({ nullable: true }).isInt({ min: 0, max: 10 });
exports.sortOrder = body('sortOrder').optional().isInt();
exports.verifyEmailQuery = query('email').isEmail().normalizeEmail();
exports.deviceId = body('deviceId').optional().isString().isLength({ max: 200 });
exports.refresh = body('refresh').isString().isLength({ min: 1, max: 1000 });
exports.storyIdBody = body('storyId').isInt({ min: 1 }).toInt();
exports.orderArray = body('order')
  .isArray({ min: 1 })
  .custom(arr => Array.isArray(arr) && arr.every(x => Number.isInteger(Number(x)) && Number(x) >= 1))
  .withMessage('order must be an array of positive integers');

exports.phoneRU = body('phone')
  .exists({ checkFalsy: true }).withMessage('Укажите телефон.')
  .bail()
  .custom((value) => {
    const normalized = normalizeRuPhone(value);
    if (!normalized) throw new Error('Неверный формат телефона (РФ).');
    return true;
  })
  .customSanitizer((value) => normalizeRuPhone(value));
