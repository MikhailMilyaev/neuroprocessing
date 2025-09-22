const { Op } = require('sequelize');
const { RefreshToken } = require('../models/models');

async function cleanupRefreshTokens() {
  try {
    const n = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lte]: new Date() } },
          { revokedAt: { [Op.ne]: null } },
        ]
      }
    });
    if (n) console.log(`[cleanup] removed ${n} old refresh tokens`);
  } catch (e) {
    console.error('[cleanup] error:', e);
  }
}

module.exports = { cleanupRefreshTokens };
