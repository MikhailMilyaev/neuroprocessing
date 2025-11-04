'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const JSON_TYPE = dialect === 'postgres' ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('practice_runs', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      practice_slug: { type: Sequelize.STRING(64), allowNull: false },
      idea_slug: { type: Sequelize.TEXT, allowNull: false },
      idea_text: { type: Sequelize.TEXT, allowNull: false },

      state: { type: JSON_TYPE, allowNull: false, defaultValue: dialect === 'postgres' ? Sequelize.literal(`'{}'::jsonb`) : {} },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('practice_runs', ['user_id']);
    await queryInterface.addIndex('practice_runs', ['createdAt']);
    await queryInterface.addConstraint('practice_runs', {
      type: 'unique',
      fields: ['user_id', 'practice_slug', 'idea_slug'],
      name: 'ux_practice_runs_user_practice_idea',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('practice_runs');
  }
};
