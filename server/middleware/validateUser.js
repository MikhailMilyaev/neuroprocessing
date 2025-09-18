const { body } = require('express-validator')

exports.validateLogin = [
    body('email').normalizeEmail().isEmail
]