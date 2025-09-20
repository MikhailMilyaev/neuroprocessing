'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true },
      password: { type: Sequelize.STRING },
      prevPasswordHash: { type: Sequelize.STRING },
      role: { type: Sequelize.STRING, defaultValue: 'USER' },
      isVerified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      verificationToken: { type: Sequelize.STRING },
      verificationTokenExpires: { type: Sequelize.DATE },
      verificationLastSentAt: { type: Sequelize.DATE },
      verificationResendCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      verificationResendResetAt: { type: Sequelize.DATE },
      passwordResetToken: { type: Sequelize.STRING },
      passwordResetExpires: { type: Sequelize.DATE },
      resetLastSentAt: { type: Sequelize.DATE },
      resetResendCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      resetResendResetAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('stories', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
      content: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      archive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      stop_content_y: { type: Sequelize.INTEGER },
      baseline_content: { type: Sequelize.TEXT },
      reeval_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      show_archive_section: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      last_view_content_y: { type: Sequelize.INTEGER },
      reminders_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      reminders_freq_sec: { type: Sequelize.INTEGER, defaultValue: 30 },
      reminders_index: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      reminders_paused: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      reeval_due_at: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('stories', ['userId']);
    await queryInterface.addIndex('stories', ['createdAt']);
    await queryInterface.addIndex('stories', ['reeval_due_at']);

    await queryInterface.createTable('ideas', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      storyId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stories', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      text: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      score: { type: Sequelize.INTEGER },
      introduced_round: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      sort_order: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('ideas', ['storyId']);
    await queryInterface.addIndex('ideas', ['storyId', 'sort_order']);

    await queryInterface.createTable('reevals', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      story_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stories', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      round: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('reevals', ['story_id', 'round'], { unique: true });
    await queryInterface.addIndex('reevals', ['createdAt']);

    await queryInterface.createTable('reeval_items', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      reeval_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'reevals', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      idea_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ideas', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      score: { type: Sequelize.INTEGER },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('reeval_items', ['reeval_id']);
    await queryInterface.addIndex('reeval_items', ['idea_id']);

    await queryInterface.createTable('inbox_ideas', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      text: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      sort_order: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('inbox_ideas', ['user_id']);
    await queryInterface.addIndex('inbox_ideas', ['user_id', 'sort_order']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inbox_ideas');
    await queryInterface.dropTable('reeval_items');
    await queryInterface.dropTable('reevals');
    await queryInterface.dropTable('ideas');
    await queryInterface.dropTable('stories');
    await queryInterface.dropTable('users');
  }
};
