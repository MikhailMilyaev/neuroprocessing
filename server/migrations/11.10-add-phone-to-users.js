'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // смотрим, что уже есть
    const table = await queryInterface.describeTable('users');

    // 1) phone
    if (!table.phone) {
      await queryInterface.addColumn('users', 'phone', {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: '+70000000000',
      });

      // убираем default, если делал как у тебя
      await queryInterface.changeColumn('users', 'phone', {
        type: Sequelize.STRING(16),
        allowNull: false,
      });
    } else {
      // на всякий случай выравниваем allowNull=false (если вдруг было иначе)
      try {
        await queryInterface.changeColumn('users', 'phone', {
          type: Sequelize.STRING(16),
          allowNull: false,
        });
      } catch {}
    }

    // 2) phoneVerified
    if (!table.phoneVerified) {
      await queryInterface.addColumn('users', 'phoneVerified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // 3) индекс на phone — добавляем, только если его нет
    try {
      const indexes = await queryInterface.showIndex('users');
      const hasIdx = indexes?.some((i) => i.name === 'users_phone_idx');
      if (!hasIdx) {
        await queryInterface.addIndex('users', ['phone'], { name: 'users_phone_idx' });
      }
    } catch {
      // `showIndex` может отсутствовать в отдельных диалектах — тогда просто молча пробуем добавить
      try { await queryInterface.addIndex('users', ['phone'], { name: 'users_phone_idx' }); } catch {}
    }
  },

  async down(queryInterface, Sequelize) {
    // аккуратно откатываем, только если реально существует
    try { await queryInterface.removeIndex('users', 'users_phone_idx'); } catch {}

    const table = await queryInterface.describeTable('users');
    if (table.phone) {
      await queryInterface.removeColumn('users', 'phone');
    }
    if (table.phoneVerified) {
      await queryInterface.removeColumn('users', 'phoneVerified');
    }
  },
};
