'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const sql = (s, opts = {}) => qi.sequelize.query(s, opts);

    // 1) Переименовать таблицы (данные сохраняются)
    await qi.renameTable('ideas', 'story_ideas');
    await qi.renameTable('inbox_ideas', 'idea_drafts');

    // 2) (опционально) Переименовать индексы, если они существуют
    const tryRenameIndex = async (oldName, newName) => {
      await sql(`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = '${oldName}') THEN
          EXECUTE 'ALTER INDEX "${oldName}" RENAME TO "${newName}"';
        END IF;
      END $$;`);
    };

    await tryRenameIndex('ideas_storyId', 'story_ideas_storyId');
    await tryRenameIndex('ideas_storyId_sort_order', 'story_ideas_storyId_sort_order');
    await tryRenameIndex('inbox_ideas_actor_id', 'idea_drafts_actor_id');
    await tryRenameIndex('inbox_ideas_actor_id_sort_order', 'idea_drafts_actor_id_sort_order');
  },

  async down(qi, Sequelize) {
    const sql = (s, opts = {}) => qi.sequelize.query(s, opts);

    await qi.renameTable('story_ideas', 'ideas');
    await qi.renameTable('idea_drafts', 'inbox_ideas');

    const tryRenameIndex = async (oldName, newName) => {
      await sql(`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = '${oldName}') THEN
          EXECUTE 'ALTER INDEX "${oldName}" RENAME TO "${newName}"';
        END IF;
      END $$;`);
    };

    await tryRenameIndex('story_ideas_storyId', 'ideas_storyId');
    await tryRenameIndex('story_ideas_storyId_sort_order', 'ideas_storyId_sort_order');
    await tryRenameIndex('idea_drafts_actor_id', 'inbox_ideas_actor_id');
    await tryRenameIndex('idea_drafts_actor_id_sort_order', 'inbox_ideas_actor_id_sort_order');
  }
};
