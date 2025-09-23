'use strict';

module.exports = {
  async up(qi, Sequelize) {
    await qi.changeColumn('identity_links', 'cipher_blob', { type: Sequelize.TEXT, allowNull: true });

    const { encryptLink, KEY_VERSION } = require('../utils/cryptoIdentity');
    const [rows] = await qi.sequelize.query(
      `SELECT id, actor_id FROM identity_links WHERE cipher_blob IS NULL AND actor_id IS NOT NULL`
    );
    for (const r of rows) {
      const blob = encryptLink({ actor_id: r.actor_id });
      await qi.sequelize.query(
        `UPDATE identity_links SET cipher_blob = $1, key_version = $2 WHERE id = $3`,
        { bind: [blob, KEY_VERSION, r.id] }
      );
    }

    await qi.changeColumn('identity_links', 'cipher_blob', { type: Sequelize.TEXT, allowNull: false });

    try { await qi.removeIndex('identity_links', ['actor_id']); } catch {}
    try { await qi.removeColumn('identity_links', 'actor_id'); } catch {}
  },

  async down(qi, Sequelize) {
    await qi.addColumn('identity_links', 'actor_id', { type: Sequelize.UUID, allowNull: true });

    const { decryptLink } = require('../utils/cryptoIdentity');
    const [rows] = await qi.sequelize.query(`SELECT id, cipher_blob FROM identity_links`);
    for (const r of rows) {
      let aid = null;
      try { const dec = decryptLink(r.cipher_blob); aid = dec && dec.actor_id ? dec.actor_id : null; } catch {}
      await qi.sequelize.query(
        `UPDATE identity_links SET actor_id = $1 WHERE id = $2`,
        { bind: [aid, r.id] }
      );
    }

    await qi.addIndex('identity_links', ['actor_id']);
    await qi.changeColumn('identity_links', 'cipher_blob', { type: Sequelize.TEXT, allowNull: true });
  }
};
