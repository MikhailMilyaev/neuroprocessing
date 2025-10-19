const { Story, StoryIdea } = require('../models/models');
const sequelize = require('../db');
const { Sequelize } = require('sequelize');

async function ensureStoryOwner(actor_id, storyId) {
  const story = await Story.findOne({ where: { id: storyId, actor_id } });
  return story ? story : null;
}

function normalizeStoryIdeaText(input) {
  const raw = input != null ? String(input) : '';
  const trimmed = raw.replace(/\r\n/g, '\n').trim();
  if (trimmed.length === 0) return '\u200B';
  return trimmed;
}

class StoryIdeaController {
  async listForStory(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });
      const { storyId } = req.params;
      const story = await ensureStoryOwner(actor_id, storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const archivedOrder = Sequelize.literal('CASE WHEN "score" = 0 THEN 1 ELSE 0 END');
      const ideas = await StoryIdea.findAll({
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
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });
      const story = await ensureStoryOwner(actor_id, storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const last = await StoryIdea.findOne({
        where: { storyId },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
        attributes: ['sortOrder'],
      });
      const nextOrder = last ? (Number(last.sortOrder) + 1) : 1;

      const text  = normalizeStoryIdeaText(req.body?.text);
      const score = req.body?.score == null ? null : Number(req.body.score);
      const introducedRound = Number.isFinite(req.body?.introducedRound) ? Number(req.body.introducedRound) : 0;

      const idea = await StoryIdea.create({ storyId, text, score, introducedRound, sortOrder: nextOrder });

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;
        if (hub) {
          hub.publish(`story:${storyId}`, {
            type: 'idea.created',
            storyId: Number(storyId),
            ideaId: Number(idea.id),
            opId,
            payload: {
              id: idea.id,
              text: idea.text || '',
              score: idea.score,
              introducedRound: idea.introducedRound ?? 0,
              sortOrder: idea.sortOrder ?? 0,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish idea.create] fail:', e?.message || e);
      }

      res.status(201).json(idea);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;

      const idea = await StoryIdea.findByPk(id);
      if (!idea) return res.status(404).json({ message: 'Идея не найдена' });

      const story = await ensureStoryOwner(actor_id, idea.storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const incoming = req.body || {};
      const data = {};

      if (incoming.text !== undefined) {
        data.text = normalizeStoryIdeaText(incoming.text);
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
        const last = await StoryIdea.findOne({
          where: { storyId: idea.storyId },
          order: [['sortOrder', 'DESC'], ['id', 'DESC']],
          attributes: ['sortOrder'],
        });
        const nextOrder = last ? (Number(last.sortOrder) + 1) : 1;
        data.sortOrder = nextOrder;
      }

      await StoryIdea.update(data, { where: { id } });
      const updated = await StoryIdea.findByPk(id);

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;
        if (hub) {
          hub.publish(`story:${idea.storyId}`, {
            type: 'idea.updated',
            storyId: Number(idea.storyId),
            ideaId: Number(id),
            opId,
            patch: {
              ...(incoming.text !== undefined ? { text: updated.text } : {}),
              ...(hasIncomingScore ? { score: updated.score } : {}),
              ...(data.sortOrder !== undefined ? { sortOrder: updated.sortOrder } : {}),
              introducedRound: updated.introducedRound ?? 0,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish idea.update] fail:', e?.message || e);
      }

      res.json(updated);
    } catch (e) {
      next(e);
    }
  }

  async remove(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;
      const idea = await StoryIdea.findByPk(id);
      if (!idea) return res.status(404).json({ message: 'Идея не найдена' });

      const story = await ensureStoryOwner(actor_id, idea.storyId);
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      await StoryIdea.destroy({ where: { id } });

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;
        if (hub) {
          hub.publish(`story:${idea.storyId}`, {
            type: 'idea.deleted',
            storyId: Number(idea.storyId),
            ideaId: Number(id),
            opId
          });
        }
      } catch (e) {
        console.warn('[ws publish idea.remove] fail:', e?.message || e);
      }

      res.json({ ok: true });
    } catch (e) { next(e); }
  }

  async reorder(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const actor_id = req.actorId;
      if (!actor_id) { await t.rollback(); return res.status(401).json({ message: 'Unauthorized' }); }
      const { storyId, order } = req.body || {};
      const story = await ensureStoryOwner(actor_id, storyId);
      if (!story) { await t.rollback(); return res.status(404).json({ message: 'История не найдена' }); }

      if (!Array.isArray(order) || !order.length) {
        await t.rollback(); return res.status(400).json({ message: 'Некорректный список' });
      }

      const ideas = await StoryIdea.findAll({ where: { storyId }, attributes: ['id'], transaction: t });
      const set = new Set(ideas.map(i => String(i.id)));
      if (order.length !== ideas.length) {
        await t.rollback(); return res.status(400).json({ message: 'Несоответствие количества id' });
      }
      for (const x of order) {
        if (!set.has(String(x))) {
          await t.rollback(); return res.status(400).json({ message: 'Несоответствие id' });
        }
      }

      let idx = order.length;
      for (const ideaId of order) {
        await StoryIdea.update({ sortOrder: idx-- }, { where: { id: ideaId }, transaction: t });
      }

      await t.commit();

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;
        if (hub) {
          hub.publish(`story:${storyId}`, {
            type: 'idea.reordered',
            storyId: Number(storyId),
            order: order.map(Number),
            opId
          });
        }
      } catch (e) {
        console.warn('[ws publish idea.reorder] fail:', e?.message || e);
      }

      res.json({ ok: true });
    } catch (e) { await t.rollback(); next(e); }
  }
}

module.exports = new StoryIdeaController();
