const { Story, Idea } = require('../models/models');
const sequelize = require('../db');

async function ensureStoryOwner(actor_id, storyId) {
  const story = await Story.findOne({ where: { id: storyId, actor_id } });
  return story ? story : null;
}

class IdeaController {
  async listForStory(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { storyId } = req.params;
      const story = await ensureStoryOwner(actor_id, storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const ideas = await Idea.findAll({
        where: { storyId },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
      });
      res.json(ideas);
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const storyId = req.params?.storyId ?? req.body?.storyId;
      if (!storyId) return res.status(400).json({ message: 'Не указан storyId' });

      const actor_id = req.actorId;
      const story = await ensureStoryOwner(actor_id, storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const last = await Idea.findOne({
        where: { storyId },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
        attributes: ['sortOrder'],
      });
      const sortOrder = last ? (Number(last.sortOrder) + 1) : 1;
      const text  = req.body.text != null ? String(req.body.text) : '';
      const score = req.body.score == null ? null : Number(req.body.score);

      const idea = await Idea.create({ storyId, text, score, sortOrder });
      res.status(201).json(idea);
    } catch (e) { next(e); }
  }

  async createForStory(req, res, next) {
    return this.create(req, res, next);
  }

  async update(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { id } = req.params;
      const idea = await Idea.findByPk(id);
      if (!idea) return res.status(404).json({ message: 'Идея не найдена' });

      const story = await ensureStoryOwner(actor_id, idea.storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const data = {};
      if (req.body.text !== undefined) data.text = String(req.body.text);
      if (req.body.score !== undefined) data.score = req.body.score == null ? null : Number(req.body.score);
      if (req.body.sortOrder !== undefined) data.sortOrder = Number(req.body.sortOrder);

      const [count, rows] = await Idea.update(data, { where: { id }, returning: true });
      if (!count) return res.status(404).json({ message: 'Идея не найдена' });
      res.json(rows[0]);
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      const actor_id = req.actorId;
      const { id } = req.params;
      const idea = await Idea.findByPk(id);
      if (!idea) return res.status(404).json({ message: 'Идея не найдена' });

      const story = await ensureStoryOwner(actor_id, idea.storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      await Idea.destroy({ where: { id } });
      res.json({ ok: true });
    } catch (e) { next(e); }
  }

  async reorder(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const actor_id = req.actorId;
      const { storyId, order } = req.body || {};
      const story = await ensureStoryOwner(actor_id, storyId);
      if (!story) { await t.rollback(); return res.status(404).json({ message: 'История не найдена' }); }

      if (!Array.isArray(order) || !order.length) {
        await t.rollback(); return res.status(400).json({ message: 'Некорректный список' });
      }
      const ideas = await Idea.findAll({ where: { storyId }, attributes: ['id'], transaction: t });
      const set = new Set(ideas.map(i => String(i.id)));
      for (const x of order) if (!set.has(String(x))) {
        await t.rollback(); return res.status(400).json({ message: 'Несоответствие id' });
      }
      let idx = 1;
      for (const ideaId of order) {
        await Idea.update({ sortOrder: idx++ }, { where: { id: ideaId }, transaction: t });
      }
      await t.commit();
      res.json({ ok: true });
    } catch (e) { await t.rollback(); next(e); }
  }
}

module.exports = new IdeaController();
