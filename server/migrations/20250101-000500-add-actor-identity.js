'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('identity_links', {
        id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        actor_id: { type: Sequelize.UUID, allowNull: false },
        cipher_blob: { type: Sequelize.TEXT, allowNull: true },
        key_version: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'v1' },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      }, { transaction: t });

      await queryInterface.addConstraint('identity_links', {
        fields: ['user_id'],
        type: 'unique',
        name: 'identity_links_user_id_key',
        transaction: t,
      });
      await queryInterface.addConstraint('identity_links', {
        fields: ['actor_id'],
        type: 'unique',
        name: 'identity_links_actor_id_key',
        transaction: t,
      });

      await queryInterface.addColumn('stories', 'actor_id', {
        type: Sequelize.UUID,
        allowNull: true,
      }, { transaction: t });
      await queryInterface.addIndex('stories', ['actor_id'], {
        name: 'stories_actor_id_idx',
        transaction: t,
      });

      await queryInterface.addColumn('inbox_ideas', 'actor_id', {
        type: Sequelize.UUID,
        allowNull: true,
      }, { transaction: t });
      await queryInterface.addIndex('inbox_ideas', ['actor_id'], {
        name: 'inbox_ideas_actor_id_idx',
        transaction: t,
      });

      const [users] = await queryInterface.sequelize.query(
        'SELECT id FROM users ORDER BY id',
        { transaction: t }
      );
      for (const u of users) {
        const [exists] = await queryInterface.sequelize.query(
          'SELECT 1 FROM identity_links WHERE user_id = :uid',
          { transaction: t, replacements: { uid: u.id } }
        );
        if (!exists || !exists.length) {
          await queryInterface.sequelize.query(
            `INSERT INTO identity_links (user_id, actor_id, key_version, "createdAt", "updatedAt")
             VALUES (:uid, :aid, 'v1', NOW(), NOW())`,
            { transaction: t, replacements: { uid: u.id, aid: uuidv4() } }
          );
        }
      }

      await queryInterface.sequelize.query(
        `UPDATE stories s
           SET actor_id = il.actor_id
          FROM identity_links il
         WHERE il.user_id = s."userId" AND s.actor_id IS NULL`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE inbox_ideas ii
           SET actor_id = il.actor_id
          FROM identity_links il
         WHERE il.user_id = ii.user_id AND ii.actor_id IS NULL`,
        { transaction: t }
      );

      await queryInterface.addIndex('stories', ['actor_id', 'slug'], {
        name: 'stories_actor_id_slug_unique',
        unique: true,
        transaction: t,
      });

      try {
        await queryInterface.removeIndex('stories', 'stories_userId_slug', { transaction: t });
      } catch {}
      try {
        await queryInterface.removeIndex('stories', ['userId', 'slug'], { transaction: t });
      } catch {}

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addIndex('stories', ['userId', 'slug'], {
        name: 'stories_userId_slug',
        unique: true,
        transaction: t,
      });

      try {
        await queryInterface.removeIndex('stories', 'stories_actor_id_slug_unique', { transaction: t });
      } catch {}
      try {
        await queryInterface.removeIndex('stories', 'stories_actor_id_idx', { transaction: t });
      } catch {}
      await queryInterface.removeColumn('stories', 'actor_id', { transaction: t });

      try {
        await queryInterface.removeIndex('inbox_ideas', 'inbox_ideas_actor_id_idx', { transaction: t });
      } catch {}
      await queryInterface.removeColumn('inbox_ideas', 'actor_id', { transaction: t });

      await queryInterface.dropTable('identity_links', { transaction: t });

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
};
