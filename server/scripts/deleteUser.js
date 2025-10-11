#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config();
const sequelize = require('../db');
const { User, RefreshToken, IdentityLink, Story } = require('../models/models');
const { decryptLink } = require('../utils/cryptoIdentity');

async function main() {
  const argv = process.argv.join(' ');
  const m = argv.match(/--email\s+("([^"]+)"|'([^']+)'|(\S+))/);
  const emailRaw = (m && (m[2] || m[3] || m[4])) || null;
  if (!emailRaw) {
    console.error('Usage: node server/scripts/deleteUser.js --email user@example.com');
    process.exit(1);
  }
  const email = String(emailRaw).trim().toLowerCase();

  await sequelize.transaction(async (t) => {
    const user = await User.findOne({ where: { email }, transaction: t });
    if (!user) {
      console.log('User not found:', email);
      return;
    }

    const link = await IdentityLink.findOne({ where: { user_id: user.id }, transaction: t });
    let actorId = null;
    if (link) {
      try {
        const pl = decryptLink(link.cipher_blob);
        actorId = pl?.actor_id || null;
      } catch (e) {
        console.warn('decryptLink failed, continue without actor_id:', e.message);
      }
    }

    if (actorId) {
      const storiesDeleted = await Story.destroy({ where: { actor_id: actorId }, transaction: t });
      console.log('Stories deleted:', storiesDeleted);
    } else {
      console.log('No actor_id. Stories not deleted (none linked or decryption failed).');
    }

    const rDel = await RefreshToken.destroy({ where: { userId: user.id }, transaction: t });
    console.log('Refresh tokens deleted:', rDel);

    const ilDel = await IdentityLink.destroy({ where: { user_id: user.id }, transaction: t });
    console.log('Identity links deleted:', ilDel);

    await user.destroy({ transaction: t });
    console.log('User deleted:', user.id, email);
  });

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
