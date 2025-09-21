'use strict';

module.exports = {
  async up(q, Sequelize) {
    await q.addColumn('refresh_tokens', 'device_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await q.addIndex('refresh_tokens', ['user_id', 'device_id']);
    await q.addIndex('refresh_tokens', ['createdAt']);
  },
  async down(q) {
    await q.removeIndex('refresh_tokens', ['user_id', 'device_id']);
    await q.removeIndex('refresh_tokens', ['createdAt']);
    await q.removeColumn('refresh_tokens', 'device_id');
  }
};
