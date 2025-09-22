'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stories', 'slug', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.sequelize.query(`
      UPDATE stories SET slug = CONCAT('draft-', id) WHERE slug = ''
    `);

    await queryInterface.addIndex('stories', ['userId', 'slug'], {
      unique: true,
      name: 'stories_userId_slug_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('stories', 'stories_userId_slug_unique');
    await queryInterface.removeColumn('stories', 'slug');
  }
};
