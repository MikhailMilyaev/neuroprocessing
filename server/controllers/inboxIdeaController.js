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
    const { additionalIds = [] } = req.body || {};

    // Собираем все переносимые id (уникальные)
    const allIds = [Number(id), ...additionalIds.map(Number)]
      .filter((v, i, a) => Number.isFinite(v) && a.indexOf(v) === i);

    // Проверим, что "первая" запись точно принадлежит актору
    const base = await InboxIdea.findOne({ where: { id: allIds[0], actor_id }, transaction: t });
    if (!base) { await t.rollback(); return res.status(404).json({ message: 'Запись не найдена' }); }

    // Создаём пустую историю
    const story = await Story.create(
      { actor_id, title: '', content: '', archive: false, slug: String(Date.now()), showArchiveSection: true },
      { transaction: t }
    );

    // Берём все инбокс-строки актёра по этим id в том порядке, как на экране Inbox:
    // (sortOrder DESC, id DESC)
    const inboxRows = await InboxIdea.findAll({
      where: { actor_id, id: allIds },
      order: [['sortOrder', 'DESC'], ['id', 'DESC']],
      transaction: t,
    });

    // Узнаём текущий MAX(sort_order) по идеям этой истории (для новой истории = 0)
    const [[{ max_sort }]] = await sequelize.query(
      'SELECT COALESCE(MAX("sort_order"), 0) AS max_sort FROM ideas WHERE "storyId" = :sid',
      { replacements: { sid: story.id }, transaction: t }
    );
    const baseMax = Number(max_sort) || 0;

    // Назначаем sort_order так, чтобы первый из inboxRows оказался сверху в истории
    // Порядок сортировки идей в истории у тебя: sortOrder DESC, id DESC
    // Значит даём убывающую «лестницу» сверху вниз: baseMax + N, baseMax + (N-1), ...
    const N = inboxRows.length;
    for (let i = 0; i < N; i++) {
      const row = inboxRows[i];
      const sortOrder = baseMax + (N - i);
      await Idea.create(
        { storyId: story.id, text: row.text || '', score: null, introducedRound: 0, sortOrder },
        { transaction: t }
      );
    }

    // Удаляем все перенесённые из инбокса разом
    await InboxIdea.destroy({ where: { actor_id, id: allIds }, transaction: t });

    await t.commit();

    // 🔔 realtime
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
      console.warn('[ws publish inbox.createStory bulk order] fail:', e?.message || e);
    }

    return res.status(201).json({ storyId: story.id, slug: story.slug });
  } catch (e) {
    await t.rollback();
    return next(e);
  }
}


}

module.exports = new InboxIdeaController();
