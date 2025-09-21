const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  prevPasswordHash: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, defaultValue: 'USER' },
  isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  verificationToken: { type: DataTypes.STRING, allowNull: true },
  verificationTokenExpires: { type: DataTypes.DATE, allowNull: true },
  verificationLastSentAt: { type: DataTypes.DATE, allowNull: true },
  verificationResendCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  verificationResendResetAt: { type: DataTypes.DATE, allowNull: true },
  passwordResetToken: { type: DataTypes.STRING, allowNull: true },
  passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
  resetLastSentAt: { type: DataTypes.DATE, allowNull: true },
  resetResendCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  resetResendResetAt: { type: DataTypes.DATE, allowNull: true },
});

const Story = sequelize.define('story', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
  content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  archive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  stopContentY: { type: DataTypes.INTEGER, allowNull: true, field: 'stop_content_y' },
  baselineContent: { type: DataTypes.TEXT, allowNull: true, field: 'baseline_content' },
  reevalCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'reeval_count' },
  showArchiveSection: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_archive_section' },
  lastViewContentY: { type: DataTypes.INTEGER, allowNull: true, field: 'last_view_content_y' },
  remindersEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'reminders_enabled' },
  remindersFreqSec: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 30, field: 'reminders_freq_sec' },
  remindersIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'reminders_index' },
  remindersPaused: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'reminders_paused' },
  reevalDueAt: { type: DataTypes.DATE, allowNull: true, field: 'reeval_due_at' },
}, {
  indexes: [{ fields: ['userId'] }, { fields: ['createdAt'] }, { fields: ['reeval_due_at'] }],
});

const Idea = sequelize.define('idea', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  storyId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  score: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },
  introducedRound: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'introduced_round' },
  sortOrder: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, field: 'sort_order' },
}, {
  indexes: [{ fields: ['storyId'] }, { fields: ['storyId', 'sort_order'] }],
});

const Reeval = sequelize.define('reeval', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  storyId: { type: DataTypes.INTEGER, allowNull: false, field: 'story_id' },
  round: { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [{ fields: ['story_id', 'round'], unique: true }, { fields: ['createdAt'] }],
});

const ReevalItem = sequelize.define('reeval_item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reevalId: { type: DataTypes.INTEGER, allowNull: false, field: 'reeval_id' },
  ideaId: { type: DataTypes.INTEGER, allowNull: false, field: 'idea_id' },
  score: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },
}, {
  indexes: [{ fields: ['reeval_id'] }, { fields: ['idea_id'] }],
});

const InboxIdea = sequelize.define('inbox_idea', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  text: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  sortOrder: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, field: 'sort_order' },
}, {
  indexes: [{ fields: ['user_id'] }, { fields: ['user_id', 'sort_order'] }],
});

const RefreshToken = sequelize.define('refresh_token', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  tokenHash: { type: DataTypes.STRING, allowNull: false, field: 'token_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
  userAgent: { type: DataTypes.STRING, allowNull: true, field: 'user_agent' },
  ip: { type: DataTypes.STRING, allowNull: true },
  deviceId:  { type: DataTypes.STRING, allowNull: true, field: 'device_id' },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['token_hash'], unique: true },
    { fields: ['user_id', 'device_id'] },
    { fields: ['createdAt'] },
  ],
});

User.hasMany(InboxIdea, { as: 'inboxIdeas', foreignKey: 'user_id', sourceKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
InboxIdea.belongsTo(User, { as: 'author', foreignKey: 'user_id', targetKey: 'id' });

User.hasMany(Story, { as: 'stories', foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Story.belongsTo(User, { as: 'author', foreignKey: 'userId' });

Story.hasMany(Idea, { as: 'ideas', foreignKey: 'storyId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Idea.belongsTo(Story, { as: 'story', foreignKey: 'storyId' });

Story.hasMany(Reeval, { as: 'reevals', foreignKey: 'storyId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Reeval.belongsTo(Story, { as: 'story', foreignKey: 'storyId' });

Reeval.hasMany(ReevalItem, { as: 'items', foreignKey: 'reevalId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ReevalItem.belongsTo(Reeval, { as: 'reeval', foreignKey: 'reevalId' });

Idea.hasMany(ReevalItem, { as: 'history', foreignKey: 'ideaId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ReevalItem.belongsTo(Idea, { as: 'idea', foreignKey: 'ideaId' });

User.hasMany(RefreshToken, { as: 'rtokens', foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
RefreshToken.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

async function bumpStoryUpdated(storyId) {
  await Story.update(
    { updatedAt: sequelize.literal('CURRENT_TIMESTAMP') },
    { where: { id: storyId } }
  );
}
Idea.addHook('afterCreate', async (idea) => { await bumpStoryUpdated(idea.storyId); });
Idea.addHook('afterUpdate', async (idea) => { await bumpStoryUpdated(idea.storyId); });
Idea.addHook('afterDestroy', async (idea) => { await bumpStoryUpdated(idea.storyId); });

module.exports = { User, Story, Idea, Reeval, ReevalItem, InboxIdea, RefreshToken };
