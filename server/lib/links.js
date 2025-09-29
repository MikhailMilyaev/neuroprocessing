const VERIFY_BASE_URL = process.env.VERIFY_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3000'
const RESET_BASE_URL = process.env.RESET_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3000'

function buildVerifyLink(token) {
  return new URL('/account-activated?token=' + encodeURIComponent(token), VERIFY_BASE_URL).toString()
}

function buildResetLink(token) {
  return new URL('/reset-password?token=' + encodeURIComponent(token), RESET_BASE_URL).toString()
}

module.exports = { buildVerifyLink, buildResetLink }
