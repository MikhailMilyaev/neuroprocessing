const { IdeaDraft, Story, StoryIdea } = require('../models/models');
const sequelize = require('../db');
const { draftSlug } = require('../utils/slug');

async function ensureDraftOwner(actor_id, id) {
  const row = await IdeaDraft.findOne({ where: { id, actor_id } });
  return row ? { actor_id, row } : null;
}

async function ensureUniqueSlug(actorId, base) {
  let attempt = 0;
  const baseSafe = base && base.length ? base : draftSlug();
  while (true) {
    const candidate = attempt ? `${baseSafe}-${attempt}` : baseSafe;
    const exists = await Story.findOne({ where: { actor_id: actorId, slug: candidate } });
    if (!exists) return candidate;
    attempt++;
  }
}

class IdeaDraftController {
  async list(req, res, next) {
    try {
      const actor_id = req.actorId;
      const rows = await IdeaDraft.findAll({
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
        'SELECT COALESCE(MAX("sort_order"), 0) + 1 AS next_sort FROM idea_drafts WHERE actor_id = :actor',
        { replacements: { actor: actor_id } }
      );
      const sortOrder = Number(next_sort);
      const row = await IdeaDraft.create({ actor_id, text, sortOrder });

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
      const ctx = await ensureDraftOwner(actor_id, id);
      if (!ctx) return res.status(404).json({ message: 'Запись не найдена' });

      const data = {};
      if (req.body.text !== undefined) data.text = req.body.text;
      if (req.body.sortOrder !== undefined) {
        const n = Number(req.body.sortOrder);
        if (Number.isFinite(n)) data.sortOrder = n;
      }

      const [count, rows] = await IdeaDraft.update(data, { where: { id }, returning: true });
      if (!count) return res.status(404).json({ message: 'Запись не найдена' });
      const updated = rows[0];

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
      const ctx = await ensureDraftOwner(actor_id, id);
      if (!ctx) return res.status(404).json({ message: 'Запись не найдена' });

      await IdeaDraft.destroy({ where: { id } });

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

      const ctx = await ensureDraftOwner(actor_id, id);
      if (!ctx) { await t.rollback(); return res.status(404).json({ message: 'Запись не найдена' }); }

      const targetId = Number(targetStoryId);
      if (!Number.isFinite(targetId)) { await t.rollback(); return res.status(400).json({ message: 'Некорректный targetStoryId' }); }

      const story = await Story.findOne({ where: { id: targetId, actor_id }, transaction: t });
      if (!story) { await t.rollback(); return res.status(404).json({ message: 'История не найдена' }); }

      const [[{ next_sort }]] = await sequelize.query(
        'SELECT COALESCE(MAX("sort_order"), 0) + 1 AS next_sort FROM story_ideas WHERE "storyId" = :sid',
        { replacements: { sid: story.id }, transaction: t }
      );
      const sortOrder = Number(next_sort);

      const createdIdea = await StoryIdea.create(
        { storyId: story.id, text: ctx.row.text || '', sortOrder, score: null },
        { transaction: t }
      );
      await IdeaDraft.destroy({ where: { id }, transaction: t });

      await t.commit();

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          hub.publish(`inbox:${actor_id}`, { type: 'inbox.deleted', opId, id: Number(id) });
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
      const { additionalIds = [] } = req.body || {};

      const allIds = [Number(id), ...additionalIds.map(Number)]
        .filter((v, i, a) => Number.isFinite(v) && a.indexOf(v) === i);

      const base = await IdeaDraft.findOne({ where: { id: allIds[0], actor_id }, transaction: t });
      if (!base) { await t.rollback(); return res.status(404).json({ message: 'Запись не найдена' }); }

      const uniqueSlug = await ensureUniqueSlug(actor_id, draftSlug());

      const story = await Story.create(
        { actor_id, title: '', content: '', archive: false, slug: uniqueSlug, showArchiveSection: true },
        { transaction: t }
      );

      const inboxRows = await IdeaDraft.findAll({
        where: { actor_id, id: allIds },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
        transaction: t,
      });

      const [[{ max_sort }]] = await sequelize.query(
        'SELECT COALESCE(MAX("sort_order"), 0) AS max_sort FROM story_ideas WHERE "storyId" = :sid',
        { replacements: { sid: story.id }, transaction: t }
      );
      const baseMax = Number(max_sort) || 0;

      const N = inboxRows.length;
      for (let i = 0; i < N; i++) {
        const row = inboxRows[i];
        const sortOrder = baseMax + (N - i);
        await StoryIdea.create(
          { storyId: story.id, text: row.text || '', score: null, introducedRound: 0, sortOrder },
          { transaction: t }
        );
      }

      await IdeaDraft.destroy({ where: { actor_id, id: allIds }, transaction: t });

      await t.commit();

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.headers['x-op-id'] || null;
        if (hub) {
          for (const delId of allIds) {
            hub.publish(`inbox:${actor_id}`, { type: 'inbox.deleted', opId, id: Number(delId) });
          }
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
        }
      } catch (e) {
        console.warn('[ws publish inbox.createStory] fail:', e?.message || e);
      }

      return res.status(201).json({ storyId: story.id, slug: story.slug });
    } catch (e) {
      await t.rollback();
      return next(e);
    }
  }
}

module.exports = new IdeaDraftController();
