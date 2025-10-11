'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: '+70000000000'  
    });
    await queryInterface.addColumn('users', 'phoneVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addIndex('users', ['phone'], { name: 'users_phone_idx' });

    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING(16),
      allowNull: false
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_phone_idx').catch(()=>{});
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'phoneVerified');
  }
};
