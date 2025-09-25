const { Story, Idea } = require('../models/models');
const sequelize = require('../db');
const { Sequelize } = require('sequelize');

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

      const archivedOrder = Sequelize.literal('CASE WHEN "score" = 0 THEN 1 ELSE 0 END');
      const ideas = await Idea.findAll({
        where: { storyId },
        order: [[archivedOrder, 'ASC'], ['sortOrder', 'DESC'], ['id', 'DESC']],
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
      const nextOrder = last ? (Number(last.sortOrder) + 1) : 1;

      const text  = req.body.text != null ? String(req.body.text) : '';
      const score = req.body.score == null ? null : Number(req.body.score);
      const introducedRound = Number.isFinite(req.body?.introducedRound) ? Number(req.body.introducedRound) : 0;

      const idea = await Idea.create({ storyId, text, score, introducedRound, sortOrder: nextOrder });
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

    const incoming = req.body || {};
    const data = {};

    if (incoming.text !== undefined) {
      data.text = String(incoming.text);
    }

    const hasIncomingScore = Object.prototype.hasOwnProperty.call(incoming, 'score');

    let normalizedScore;
    if (hasIncomingScore) {
      if (incoming.score === '' || incoming.score == null) {
        normalizedScore = null;
      } else {
        const n = Number(incoming.score);
        normalizedScore = Number.isFinite(n) ? n : null;
      }
      data.score = normalizedScore;
    }

    const wasZero = idea.score === 0;                
    const incomingIsZero = hasIncomingScore && normalizedScore === 0;
    const incomingIsNull = hasIncomingScore && normalizedScore === null;

    const becomesArchived = hasIncomingScore && !wasZero && incomingIsZero;
    const becomesActive   = hasIncomingScore && wasZero && (incomingIsNull || !incomingIsZero);

    if (becomesArchived || becomesActive) {
      const last = await Idea.findOne({
        where: { storyId: idea.storyId },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
        attributes: ['sortOrder'],
      });
      const nextOrder = last ? (Number(last.sortOrder) + 1) : 1;
      data.sortOrder = nextOrder;  
    }

    await Idea.update(data, { where: { id } });
    const updated = await Idea.findByPk(id);
    res.json(updated);
  } catch (e) {
    next(e);
  }
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

      let idx = order.length;
      for (const ideaId of order) {
        await Idea.update({ sortOrder: idx-- }, { where: { id: ideaId }, transaction: t });
      }

      await t.commit();
      res.json({ ok: true });
    } catch (e) { await t.rollback(); next(e); }
  }
}

module.exports = new IdeaController();
