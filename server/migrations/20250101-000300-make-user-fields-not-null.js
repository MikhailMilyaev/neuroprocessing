'use strict';

module.exports = {
  async up(q, Sequelize) {
    await q.sequelize.transaction(async (t) => {
      await q.sequelize.query(`UPDATE users SET name = '' WHERE name IS NULL`, { transaction: t });
      await q.sequelize.query(`UPDATE users SET password = '' WHERE password IS NULL`, { transaction: t });
      await q.sequelize.query(
        `UPDATE users SET email = CONCAT('missing-', id, '@example.invalid') WHERE email IS NULL`,
        { transaction: t }
      );

      await q.changeColumn(
        'users',
        'name',
        { type: Sequelize.STRING, allowNull: false },
        { transaction: t }
      );
      await q.changeColumn(
        'users',
        'email',
        { type: Sequelize.STRING, allowNull: false },
        { transaction: t }
      );
      await q.changeColumn(
        'users',
        'password',
        { type: Sequelize.STRING, allowNull: false },
        { transaction: t }
      );
    });
  },

  async down(q, Sequelize) {
    await q.sequelize.transaction(async (t) => {
      await q.changeColumn(
        'users',
        'name',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await q.changeColumn(
        'users',
        'email',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await q.changeColumn(
        'users',
        'password',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
    });
  }
};
