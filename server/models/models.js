const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  prevPasswordHash: { type: DataTypes.STRING, allowNull: true },

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

const IdentityLink = sequelize.define('identity_link', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
  cipher_blob: { type: DataTypes.TEXT, allowNull: false },
  key_version: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'v1' },
}, {
  tableName: 'identity_links',
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ['user_id'] }],
});
IdentityLink.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

const Story = sequelize.define('story', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  actor_id: { type: DataTypes.UUID, allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
  content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  archive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  reevalCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'reeval_count' },
  showArchiveSection: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_archive_section' },
  lastViewContentY: { type: DataTypes.INTEGER, allowNull: true, field: 'last_view_content_y' },

  reevalDueAt: { type: DataTypes.DATE, allowNull: true, field: 'reeval_due_at' },
}, {
  indexes: [
    { fields: ['actor_id'] },
    { fields: ['createdAt'] },
    { fields: ['reeval_due_at'] },
    { unique: true, fields: ['actor_id', 'slug'] },
  ],
});

const StoryIdea = sequelize.define('story_idea', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  storyId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  score: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },
  introducedRound: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'introduced_round' },
  sortOrder: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, field: 'sort_order' },
}, {
  tableName: 'story_ideas',
  indexes: [{ fields: ['storyId'] }, { fields: ['storyId', 'sort_order'] }],
});

const IdeaDraft = sequelize.define('idea_draft', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  actor_id: { type: DataTypes.UUID, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  sortOrder: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, field: 'sort_order' },
}, {
  tableName: 'idea_drafts',
  indexes: [{ fields: ['actor_id'] }, { fields: ['actor_id', 'sort_order'] }],
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

const RefreshToken = sequelize.define('refresh_token', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  tokenHash: { type: DataTypes.STRING, allowNull: false, field: 'token_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
  userAgent: { type: DataTypes.STRING, allowNull: true, field: 'user_agent' },
  ip: { type: DataTypes.STRING, allowNull: true },
  deviceId: { type: DataTypes.STRING, allowNull: true, field: 'device_id' },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['token_hash'], unique: true },
    { fields: ['user_id', 'device_id'] },
    { fields: ['createdAt'] },
  ],
});
RefreshToken.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
User.hasMany(RefreshToken, { as: 'rtokens', foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Story.hasMany(StoryIdea, { as: 'ideas', foreignKey: 'storyId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
StoryIdea.belongsTo(Story, { as: 'story', foreignKey: 'storyId' });

Story.hasMany(Reeval, { as: 'reevals', foreignKey: 'storyId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Reeval.belongsTo(Story, { as: 'story', foreignKey: 'storyId' });

Reeval.hasMany(ReevalItem, { as: 'items', foreignKey: 'reevalId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ReevalItem.belongsTo(Reeval, { as: 'reeval', foreignKey: 'reevalId' });

StoryIdea.hasMany(ReevalItem, { as: 'history', foreignKey: 'ideaId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ReevalItem.belongsTo(StoryIdea, { as: 'idea', foreignKey: 'ideaId' });

const JSON_TYPE = sequelize.getDialect() === 'postgres' ? DataTypes.JSONB : DataTypes.JSON;

const PracticeRun = sequelize.define('practice_run', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },

  practiceSlug: { type: DataTypes.STRING(64), allowNull: false, field: 'practice_slug' },
  ideaSlug: { type: DataTypes.TEXT, allowNull: false, field: 'idea_slug' },
  ideaText: { type: DataTypes.TEXT, allowNull: false, field: 'idea_text' },

  state: { type: JSON_TYPE, allowNull: false, defaultValue: {} },
}, {
  tableName: 'practice_runs',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { unique: true, fields: ['user_id', 'practice_slug', 'idea_slug'] },
    { fields: ['createdAt'] },
  ],
});

PracticeRun.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(PracticeRun, { foreignKey: 'user_id', onDelete: 'CASCADE' });

async function bumpStoryUpdated(storyId) {
  await Story.update(
    { updatedAt: sequelize.literal('CURRENT_TIMESTAMP') },
    { where: { id: storyId } }
  );
}
StoryIdea.addHook('afterCreate', async (idea) => { await bumpStoryUpdated(idea.storyId); });
StoryIdea.addHook('afterUpdate', async (idea) => { await bumpStoryUpdated(idea.storyId); });
StoryIdea.addHook('afterDestroy', async (idea) => { await bumpStoryUpdated(idea.storyId); });

module.exports = {
  User,
  IdentityLink,
  Story,
  StoryIdea,
  IdeaDraft,
  Reeval,
  ReevalItem,
  RefreshToken,
  PracticeRun,
};
