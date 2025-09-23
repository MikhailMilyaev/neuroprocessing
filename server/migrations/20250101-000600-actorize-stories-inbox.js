'use strict';

async function hasColumn(qi, table, column) {
  const desc = await qi.describeTable(table);
  return !!desc[column];
}

async function hasIndex(qi, table, indexNameOrCols) {
  const idx = await qi.showIndex(table);

  // проверка по имени индекса
  if (typeof indexNameOrCols === 'string') {
    return idx.some(i => i.name === indexNameOrCols);
  }

  // универсально достаём список колонок из структуры Sequelize (fields) или на всякий случай (columns)
  const toColsKey = (i) => {
    const arr = (i.fields || i.columns || []);
    // у разных диалектов элемент может называться attribute/field/column/name
    const cols = arr.map(c =>
      (c.attribute || c.field || c.column || c.name || '').toLowerCase()
    );
    return cols.sort().join(',');
  };

  const target = indexNameOrCols.map(c => c.toLowerCase()).sort().join(',');
  return idx.some(i => toColsKey(i) === target);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // ---- STORIES ----
    if (!(await hasColumn(queryInterface, 'stories', 'actor_id'))) {
      await queryInterface.addColumn('stories', 'actor_id', { type: Sequelize.UUID, allowNull: true });
    }

    if (!(await hasIndex(queryInterface, 'stories', ['actor_id']))) {
      await queryInterface.addIndex('stories', ['actor_id']);
    }

    await queryInterface.sequelize.query(`
      UPDATE stories s
      SET actor_id = il.actor_id
      FROM identity_links il
      WHERE s.actor_id IS NULL AND CAST(s."userId" AS BIGINT) = il.user_id
    `).catch(() => {});

    await queryInterface.changeColumn('stories', 'actor_id', { type: Sequelize.UUID, allowNull: false });

    if (!(await hasIndex(queryInterface, 'stories', 'stories_actor_slug_key'))) {
      await queryInterface.addIndex('stories', { fields: ['actor_id', 'slug'], unique: true, name: 'stories_actor_slug_key' });
    }

    // убрать старую уник-сть по (userId, slug) если была
    try { await queryInterface.removeIndex('stories', ['userId', 'slug']); } catch {}
    try { await queryInterface.removeIndex('stories', 'stories_user_slug_key'); } catch {}

    if (await hasColumn(queryInterface, 'stories', 'userId')) {
      await queryInterface.removeColumn('stories', 'userId');
    }

    // ---- INBOX_IDEAS ----
    if (!(await hasColumn(queryInterface, 'inbox_ideas', 'actor_id'))) {
      await queryInterface.addColumn('inbox_ideas', 'actor_id', { type: Sequelize.UUID, allowNull: true });
    }

    if (!(await hasIndex(queryInterface, 'inbox_ideas', ['actor_id']))) {
      await queryInterface.addIndex('inbox_ideas', ['actor_id']);
    }

    await queryInterface.sequelize.query(`
      UPDATE inbox_ideas i
      SET actor_id = il.actor_id
      FROM identity_links il
      WHERE i.actor_id IS NULL AND CAST(i."user_id" AS BIGINT) = il.user_id
    `).catch(() => {});

    await queryInterface.changeColumn('inbox_ideas', 'actor_id', { type: Sequelize.UUID, allowNull: false });

    try { await queryInterface.removeIndex('inbox_ideas', ['user_id', 'sort_order']); } catch {}
    if (!(await hasIndex(queryInterface, 'inbox_ideas', ['actor_id','sort_order']))) {
      await queryInterface.addIndex('inbox_ideas', ['actor_id','sort_order']);
    }

    if (await hasColumn(queryInterface, 'inbox_ideas', 'user_id')) {
      await queryInterface.removeColumn('inbox_ideas', 'user_id');
    }
  },

  async down(queryInterface, Sequelize) {
    // ---- STORIES ----
    if (!(await hasColumn(queryInterface, 'stories', 'userId'))) {
      await queryInterface.addColumn('stories', 'userId', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!(await hasIndex(queryInterface, 'stories', ['userId']))) {
      await queryInterface.addIndex('stories', ['userId']);
    }
    await queryInterface.sequelize.query(`
      UPDATE stories s
      SET "userId" = il.user_id
      FROM identity_links il
      WHERE s.actor_id = il.actor_id
    `).catch(() => {});
    await queryInterface.changeColumn('stories', 'userId', { type: Sequelize.INTEGER, allowNull: false });

    if (!(await hasIndex(queryInterface, 'stories', 'stories_user_slug_key'))) {
      await queryInterface.addIndex('stories', { fields: ['userId', 'slug'], unique: true, name: 'stories_user_slug_key' });
    }

    try { await queryInterface.removeIndex('stories', 'stories_actor_slug_key'); } catch {}
    try { await queryInterface.removeIndex('stories', ['actor_id']); } catch {}
    if (await hasColumn(queryInterface, 'stories', 'actor_id')) {
      await queryInterface.removeColumn('stories', 'actor_id');
    }

    // ---- INBOX_IDEAS ----
    if (!(await hasColumn(queryInterface, 'inbox_ideas', 'user_id'))) {
      await queryInterface.addColumn('inbox_ideas', 'user_id', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!(await hasIndex(queryInterface, 'inbox_ideas', ['user_id','sort_order']))) {
      await queryInterface.addIndex('inbox_ideas', ['user_id','sort_order']);
    }
    await queryInterface.sequelize.query(`
      UPDATE inbox_ideas i
      SET user_id = il.user_id
      FROM identity_links il
      WHERE i.actor_id = il.actor_id
    `).catch(() => {});
    await queryInterface.changeColumn('inbox_ideas', 'user_id', { type: Sequelize.INTEGER, allowNull: false });

    try { await queryInterface.removeIndex('inbox_ideas', ['actor_id']); } catch {}
    try { await queryInterface.removeIndex('inbox_ideas', ['actor_id','sort_order']); } catch {}
    if (await hasColumn(queryInterface, 'inbox_ideas', 'actor_id')) {
      await queryInterface.removeColumn('inbox_ideas', 'actor_id');
    }
  },
};
