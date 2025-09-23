const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res
    .status(400)
    .json({ message: 'Некорректные данные', errors: errors.array() });
}

module.exports = validate;         
module.exports.validate = validate;  
module.exports.default = validate;  
