module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'subscriptionEndsAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'subscriptionEndsAt');
  },
};