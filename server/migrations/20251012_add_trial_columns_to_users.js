'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'trialStartedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'trialEndsAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'subscriptionStatus', {
      type: Sequelize.ENUM('trial', 'active', 'expired'),
      allowNull: false,
      defaultValue: 'trial',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'trialStartedAt');
    await queryInterface.removeColumn('users', 'trialEndsAt');
    await queryInterface.removeColumn('users', 'subscriptionStatus');
    // Для Postgres: удалить тип ENUM
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_subscriptionStatus";');
    } catch {}
  },
};
