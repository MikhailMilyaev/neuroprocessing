'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const sequelize = qi.sequelize;

    // Колонки могут отсутствовать в части окружений — снимаем ошибки try/catch
    const safeRemove = async (table, col) => {
      try { await qi.removeColumn(table, col); } catch {}
    };

    // 1) Сносим колонки
    await safeRemove('users', 'trialStartedAt');
    await safeRemove('users', 'trialEndsAt');
    await safeRemove('users', 'subscriptionEndsAt');

    // 2) Сносим колонку с ENUM
    try {
      await qi.removeColumn('users', 'subscriptionStatus');
    } catch {}

    // 3) Чистим тип ENUM (Postgres)
    try {
      await sequelize.query('DROP TYPE IF EXISTS "enum_users_subscriptionStatus";');
      await sequelize.query('DROP TYPE IF EXISTS "enum_users_subscriptionStatus_new";');
      await sequelize.query('DROP TYPE IF EXISTS "enum_users_subscriptionStatus_old";');
    } catch {}
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    const sequelize = qi.sequelize;

    // Возвращаем всё как было (если вдруг откатывать)
    await qi.addColumn('users', 'trialStartedAt', { type: Sequelize.DATE, allowNull: true });
    await qi.addColumn('users', 'trialEndsAt',    { type: Sequelize.DATE, allowNull: true });

    // ENUM со старым составом
    await sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_subscriptionStatus') THEN
          CREATE TYPE "enum_users_subscriptionStatus" AS ENUM ('trial','active','expired');
        END IF;
      END $$;
    `);

    await qi.addColumn('users', 'subscriptionStatus', {
      type: Sequelize.ENUM('trial','active','expired'),
      allowNull: false,
      defaultValue: 'trial',
    });

    await qi.addColumn('users', 'subscriptionEndsAt', { type: Sequelize.DATE, allowNull: true });
  },
};
