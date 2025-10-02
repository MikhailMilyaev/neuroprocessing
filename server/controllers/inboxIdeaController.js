const { InboxIdea, Story, Idea } = require('../models/models');
const sequelize = require('../db');

async function ensureInboxOwner(actor_id, id) {
  const row = await InboxIdea.findOne({ where: { id, actor_id } });
  return row ? { actor_id, row } : null;
}

class InboxIdeaController {
  async list(req, res, next) {
    try {
      const actor_id = req.actorId;
      const rows = await InboxIdea.findAll({
        where: { actor_id },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
      });
      res.json(rows);
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { text = '' } = req.body || {};
      const [[{ next_sort }]] = await sequelize.query(
        'SELECT COALESCE(MAX("sort_order"), 0) + 1 AS next_sort FROM inbox_ideas WHERE actor_id = :actor',
        { replacements: { actor: actor_id } }
      );
      const sortOrder = Number(next_sort);
      const row = await InboxIdea.create({ actor_id, text, sortOrder });

      // 🔔 realtime: новая запись в инбоксе
      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          hub.publish(`inbox:${actor_id}`, {
            type: 'inbox.created',
            opId,
            payload: {
              id: row.id,
              text: row.text || '',
              sortOrder: row.sortOrder ?? 0,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish inbox.create] fail:', e?.message || e);
      }

      res.status(201).json(row);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { id } = req.params;
      const ctx = await ensureInboxOwner(actor_id, id);
      if (!ctx) return res.status(404).json({ message: 'Запись не найдена' });

      const data = {};
      if (req.body.text !== undefined) data.text = req.body.text;
      if (req.body.sortOrder !== undefined) {
        const n = Number(req.body.sortOrder);
        if (Number.isFinite(n)) data.sortOrder = n;
      }

      const [count, rows] = await InboxIdea.update(data, { where: { id }, returning: true });
      if (!count) return res.status(404).json({ message: 'Запись не найдена' });
      const updated = rows[0];

      // 🔔 realtime: патч записи инбокса
      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          hub.publish(`inbox:${actor_id}`, {
            type: 'inbox.updated',
            opId,
            id: Number(id),
            patch: {
              ...(req.body.text !== undefined ? { text: updated.text } : {}),
              ...(req.body.sortOrder !== undefined ? { sortOrder: updated.sortOrder } : {}),
              updatedAt: updated.updatedAt,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish inbox.update] fail:', e?.message || e);
      }

      res.json(updated);
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { id } = req.params;
      const ctx = await ensureInboxOwner(actor_id, id);
      if (!ctx) return res.status(404).json({ message: 'Запись не найдена' });

      await InboxIdea.destroy({ where: { id } });

      // 🔔 realtime: удаление из инбокса
      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          hub.publish(`inbox:${actor_id}`, {
            type: 'inbox.deleted',
            opId,
            id: Number(id)
          });
        }
      } catch (e) {
        console.warn('[ws publish inbox.remove] fail:', e?.message || e);
      }

      res.json({ ok: true });
    } catch (e) { next(e); }
  }

  async move(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const actor_id = req.actorId;
      const { id } = req.params;
      const { targetStoryId } = req.body || {};

      const ctx = await ensureInboxOwner(actor_id, id);
      if (!ctx) { await t.rollback(); return res.status(404).json({ message: 'Запись не найдена' }); }

      const targetId = Number(targetStoryId);
      if (!Number.isFinite(targetId)) { await t.rollback(); return res.status(400).json({ message: 'Некорректный targetStoryId' }); }

      const story = await Story.findOne({ where: { id: targetId, actor_id }, transaction: t });
      if (!story) { await t.rollback(); return res.status(404).json({ message: 'История не найдена' }); }

      const [[{ next_sort }]] = await sequelize.query(
        'SELECT COALESCE(MAX("sort_order"), 0) + 1 AS next_sort FROM ideas WHERE "storyId" = :sid',
        { replacements: { sid: story.id }, transaction: t }
      );
      const sortOrder = Number(next_sort);

      const createdIdea = await Idea.create(
        { storyId: story.id, text: ctx.row.text || '', sortOrder, score: null },
        { transaction: t }
      );
      await InboxIdea.destroy({ where: { id }, transaction: t });

      await t.commit();

      // 🔔 realtime: инбокс - удалили пункт
      // 🔔 realtime: история - новая идея
      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          hub.publish(`inbox:${actor_id}`, {
            type: 'inbox.deleted',
            opId,
            id: Number(id)
          });
          hub.publish(`story:${story.id}`, {
            type: 'idea.created',
            storyId: Number(story.id),
            ideaId: Number(createdIdea.id),
            opId,
            payload: {
              id: createdIdea.id,
              text: createdIdea.text || '',
              score: createdIdea.score,
              introducedRound: createdIdea.introducedRound ?? 0,
              sortOrder: createdIdea.sortOrder ?? 0,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish inbox.move] fail:', e?.message || e);
      }

      return res.json({ ok: true });
    } catch (e) {
      await t.rollback();
      return next(e);
    }
  }

  async createStory(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const actor_id = req.actorId;
      const { id } = req.params;

      const ctx = await ensureInboxOwner(actor_id, id);
      if (!ctx) { await t.rollback(); return res.status(404).json({ message: 'Запись не найдена' }); }

      const story = await Story.create(
        { actor_id, title: '', content: ctx.row.text || '', archive: false, slug: String(Date.now()) },
        { transaction: t }
      );
      await InboxIdea.destroy({ where: { id }, transaction: t });

      await t.commit();

      // 🔔 realtime:
      // 1) инбокс — удалили запись
      // 2) индекс историй — добавили/обновили карточку
      // 3) комната истории — стартовое состояние
      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          hub.publish(`inbox:${actor_id}`, {
            type: 'inbox.deleted',
            opId,
            id: Number(id)
          });

          hub.publish(`actor:${actor_id}`, {
            type: 'stories.index.patch',
            storyId: Number(story.id),
            opId,
            patch: {
              id: Number(story.id),
              slug: story.slug,
              title: story.title,
              archive: story.archive,
              reevalDueAt: story.reevalDueAt ?? null,
              updatedAt: story.updatedAt,
            }
          });

          hub.publish(`story:${story.id}`, {
            type: 'story.updated',
            storyId: Number(story.id),
            version: new Date().toISOString(),
            opId,
            patch: {
              title: story.title,
              content: story.content,
              archive: story.archive,
              slug: story.slug,
              remindersEnabled: story.remindersEnabled,
              remindersFreqSec: story.remindersFreqSec,
              remindersPaused: story.remindersPaused,
              remindersIndex: story.remindersIndex,
              showArchiveSection: story.showArchiveSection ?? true,
              baselineContent: story.baselineContent ?? '',
              reevalCount: story.reevalCount ?? 0,
              stopContentY: story.stopContentY ?? null,
              lastViewContentY: story.lastViewContentY ?? null,
              reevalDueAt: story.reevalDueAt ?? null,
              updatedAt: story.updatedAt,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish inbox.createStory] fail:', e?.message || e);
      }

      return res.status(201).json(story);
    } catch (e) {
      await t.rollback();
      return next(e);
    }
  }
}

module.exports = new InboxIdeaController();
