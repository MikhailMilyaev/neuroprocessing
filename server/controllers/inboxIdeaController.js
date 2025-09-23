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
      res.json(rows[0]);
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { id } = req.params;
      const ctx = await ensureInboxOwner(actor_id, id);
      if (!ctx) return res.status(404).json({ message: 'Запись не найдена' });

      await InboxIdea.destroy({ where: { id } });
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

      await Idea.create({ storyId: story.id, text: ctx.row.text || '', sortOrder, score: null }, { transaction: t });
      await InboxIdea.destroy({ where: { id }, transaction: t });

      await t.commit();
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
      return res.status(201).json(story);
    } catch (e) {
      await t.rollback();
      return next(e);
    }
  }
}

module.exports = new InboxIdeaController();
