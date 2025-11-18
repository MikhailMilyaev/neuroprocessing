const { Story, StoryIdea, Reeval, ReevalItem } = require('../models/models');
const sequelize = require('../db');
const { Op } = require('sequelize');
const { slugify, draftSlug } = require('../utils/slug');

async function ensureUniqueSlug(actorId, rawSlug, excludeId = null) {
  let base = rawSlug || draftSlug();
  let attempt = 0;
  while (true) {
    const candidate = attempt ? `${base}-${attempt}` : base;
    const where = { actor_id: actorId, slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const exists = await Story.findOne({ where });
    if (!exists) return candidate;
    attempt++;
  }
}
function pickSlugFromTitle(title) {
  const s = slugify(title || '');
  return s || draftSlug();
}

class StoryController {
  async create(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const { title = '', content = '' } = req.body || {};
      const raw = pickSlugFromTitle(title);
      const unique = await ensureUniqueSlug(actor_id, raw);

      const story = await Story.create({
        actor_id,
        title: title || '',
        content,
        archive: false,
        slug: unique,
        showArchiveSection: true,
      });

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;
        if (hub) {
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
              showArchiveSection: story.showArchiveSection ?? true,
              reevalCount: story.reevalCount ?? 0,
              lastViewContentY: story.lastViewContentY ?? null,
              reevalDueAt: story.reevalDueAt ?? null,
              updatedAt: story.updatedAt,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish story.create] fail:', e?.message || e);
      }

      return res.json(story);
    } catch (e) { next(e); }
  }

  async getBySlug(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const { slug } = req.params;
      const story = await Story.findOne({ where: { actor_id, slug } });
      if (!story) return res.status(404).json({ message: 'История не найдена' });
      return res.json(story);
    } catch (e) { next(e); }
  }

  async list(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const archiveParam = req.query.archive;
      const limitParam   = Number.parseInt(req.query.limit, 10);
      const cursorParam  = req.query.cursor;
      const fieldsParam  = typeof req.query.fields === 'string' ? req.query.fields : null;

      const where = { actor_id };

      if (archiveParam !== undefined) {
        const val = String(archiveParam).toLowerCase();
        where.archive = (val === 'true' || val === '1');
      }

      if (cursorParam) {
        const d = new Date(cursorParam);
        if (!Number.isNaN(d.getTime())) {
          where.updatedAt = { [Op.lt]: d };
        }
      }

      const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 50, 1), 200);

      const allowed = new Set([
        'id', 'slug', 'title', 'content', 'archive', 'actor_id',
        'updatedAt', 'createdAt', 'reevalDueAt',
        'reevalCount', 'showArchiveSection', 'lastViewContentY',
      ]);
      let attributes;
      if (fieldsParam) {
        const reqFields = fieldsParam
          .split(',').map(s => s.trim()).filter(Boolean)
          .filter(f => allowed.has(f));
        if (reqFields.length) {
          if (!reqFields.includes('id')) reqFields.push('id');
          if (!reqFields.includes('updatedAt')) reqFields.push('updatedAt');
          attributes = reqFields;
        }
      }

      const rowsRaw = await Story.findAll({
        where,
        order: [['updatedAt', 'DESC'], ['id', 'DESC']],
        limit: limit + 1,
        attributes,
      });

      const hasMore   = rowsRaw.length > limit;
      const rows      = hasMore ? rowsRaw.slice(0, limit) : rowsRaw;
      const last      = rows[rows.length - 1];
      const nextCursor = hasMore && last?.updatedAt ? last.updatedAt.toISOString() : null;

      return res.json({ rows, meta: { nextCursor, hasMore } });
    } catch (e) { next(e); }
  }

  async getOne(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const { id } = req.params;
      const story = await Story.findOne({ where: { id, actor_id } });
      if (!story) return res.status(404).json({ message: 'История не найдена' });
      return res.json(story);
    } catch (e) { next(e); }
  }

  async getFull(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const { id } = req.params;
      const story = await Story.findOne({ where: { id, actor_id } });
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const ideas = await StoryIdea.findAll({
        where: { storyId: id },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
      });

      return res.json({ story, ideas });
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const { id } = req.params;
      const prev = await Story.findOne({ where: { id, actor_id } });
      if (!prev) return res.status(404).json({ message: 'История не найдена' });

      const {
        title,
        content,
        archive,
        showArchiveSection,
        showArchive,
        lastViewContentY,
        reevalDueAt,
      } = req.body;

      const updateData = {};

      if (title !== undefined) {
        updateData.title = title;
        const base = pickSlugFromTitle(title);
        updateData.slug = await ensureUniqueSlug(actor_id, base, prev.id);
      }

      if (content !== undefined) updateData.content = content;

      if (showArchiveSection !== undefined || showArchive !== undefined) {
        const v = (showArchiveSection !== undefined) ? showArchiveSection : showArchive;
        updateData.showArchiveSection = (v === true || v === 'true' || v === 1 || v === '1');
      }

      if (archive !== undefined) {
        const v = archive;
        updateData.archive = (v === true || v === 'true' || v === 1 || v === '1');
      }

      if (lastViewContentY !== undefined) {
        const n = Number(lastViewContentY);
        if (Number.isFinite(n)) updateData.lastViewContentY = Math.max(0, Math.round(n));
      }

      if (reevalDueAt !== undefined) {
        if (reevalDueAt === null || reevalDueAt === 'null' || reevalDueAt === '') {
          updateData.reevalDueAt = null;
        } else {
          const d = new Date(reevalDueAt);
          updateData.reevalDueAt = isNaN(d.getTime()) ? null : d;
        }
      }

      const [count, rows] = await Story.update(updateData, { where: { id, actor_id }, returning: true });
      if (!count) return res.status(404).json({ message: 'История не найдена' });

      const updated = rows[0];

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;

        if (hub) {
          hub.publish(`story:${id}`, {
            type: 'story.updated',
            storyId: Number(id),
            version: new Date().toISOString(),
            opId,
            patch: {
              ...(title   !== undefined ? { title:   updated.title }   : {}),
              ...(content !== undefined ? { content: updated.content } : {}),
              ...(archive !== undefined ? { archive: updated.archive } : {}),
              ...(showArchiveSection !== undefined || showArchive !== undefined
                  ? { showArchiveSection: updated.showArchiveSection } : {}),
              ...(lastViewContentY !== undefined ? { lastViewContentY: updated.lastViewContentY } : {}),
              ...(reevalDueAt      !== undefined ? { reevalDueAt:      updated.reevalDueAt }      : {}),
              ...(updateData.slug ? { slug: updated.slug } : {}),
              updatedAt: updated.updatedAt,
            }
          });

          hub.publish(`actor:${actor_id}`, {
            type: 'stories.index.patch',
            storyId: Number(id),
            opId,
            patch: {
              title: updated.title,
              archive: updated.archive,
              reevalDueAt: updated.reevalDueAt ?? null,
              updatedAt: updated.updatedAt,
              slug: updated.slug,
            }
          });
        }
      } catch (e) {
        console.warn('[ws publish story.update] fail:', e?.message || e);
      }

      return res.json(updated);
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      const actor_id = req.actorId;
      if (!actor_id) return res.status(401).json({ message: 'Unauthorized' });

      const { id } = req.params;
      const count = await Story.destroy({ where: { id, actor_id } });
      if (!count) return res.status(404).json({ message: 'История не найдена' });

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;
        if (hub) {
          hub.publish(`actor:${actor_id}`, {
            type: 'stories.index.patch',
            storyId: Number(id),
            opId,
            patch: { deleted: true, updatedAt: new Date().toISOString() }
          });
          hub.publish(`story:${id}`, {
            type: 'story.deleted',
            storyId: Number(id),
            opId
          });
        }
      } catch (e) {
        console.warn('[ws publish story.remove] fail:', e?.message || e);
      }

      return res.json({ ok: true });
    } catch (e) { next(e); }
  }

  // setStop / clearStop УДАЛЕНИ — фича больше не нужна

  async reeval(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const actor_id = req.actorId;
      if (!actor_id) { await t.rollback(); return res.status(401).json({ message: 'Unauthorized' }); }

      const { id } = req.params;
      const story = await Story.findOne({ where: { id, actor_id }, transaction: t });
      if (!story) { await t.rollback(); return res.status(404).json({ message: 'История не найдена' }); }

      const ideas = await StoryIdea.findAll({
        where: { storyId: id },
        order: [['sortOrder', 'ASC']],
        transaction: t
      });

      const isArchived = (b) => b.score !== null && b.score === 0;
      const active = ideas.filter(b => !isArchived(b));
      const allActiveScored = active.length === 0 || active.every(b => Number.isFinite(b.score) && b.score >= 1 && b.score <= 10);
      if (!allActiveScored) { await t.rollback(); return res.status(400).json({ message: 'Оцените весь список идей' }); }

      const nextRound = (story.reevalCount || 0) + 1;
      const reeval = await Reeval.create({ storyId: story.id, round: nextRound }, { transaction: t });

      const items = ideas.map(b => ({ reevalId: reeval.id, ideaId: b.id, score: b.score === null ? null : Number(b.score) }));
      if (items.length) await ReevalItem.bulkCreate(items, { transaction: t });

      if (active.length) {
        const ids = active.map(b => b.id);
        await StoryIdea.update({ score: null }, { where: { id: ids }, transaction: t });
      }

      await story.update({ reevalCount: nextRound }, { transaction: t });

      await t.commit();

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;

        if (hub) {
          hub.publish(`story:${id}`, {
            type: 'reeval.completed',
            storyId: Number(id),
            round: nextRound,
            opId
          });

          const fresh = await Story.findByPk(id);
          hub.publish(`story:${id}`, {
            type: 'story.updated',
            storyId: Number(id),
            version: new Date().toISOString(),
            opId,
            patch: {
              reevalCount: fresh?.reevalCount ?? nextRound,
              updatedAt: fresh?.updatedAt ?? new Date().toISOString()
            }
          });

          hub.publish(`actor:${actor_id}`, {
            type: 'stories.index.patch',
            storyId: Number(id),
            opId,
            patch: { updatedAt: fresh?.updatedAt ?? new Date().toISOString() }
          });
        }
      } catch (e) {
        console.warn('[ws publish story.reeval] fail:', e?.message || e);
      }

      return res.json({ round: nextRound });
    } catch (e) { await t.rollback(); next(e); }
  }

  async rereviewStart(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const actor_id = req.actorId;
      if (!actor_id) { await t.rollback(); return res.status(401).json({ message: 'Unauthorized' }); }

      const { id } = req.params;
      const story = await Story.findOne({ where: { id, actor_id }, transaction: t });
      if (!story) { await t.rollback(); return res.status(404).json({ message: 'История не найдена' }); }
      if (!story.archive) { await t.rollback(); return res.status(400).json({ message: 'История не в архиве' }); }

      const ideas = await StoryIdea.findAll({
        where: { storyId: id },
        order: [['sortOrder', 'ASC']],
        transaction: t
      });

      const nextRound = (story.reevalCount || 0) + 1;
      const reeval = await Reeval.create({ storyId: story.id, round: nextRound }, { transaction: t });

      if (ideas.length) {
        await ReevalItem.bulkCreate(
          ideas.map(b => ({ reevalId: reeval.id, ideaId: b.id, score: b.score == null ? null : Number(b.score) })),
          { transaction: t }
        );
      }

      await StoryIdea.update({ score: null }, { where: { storyId: id }, transaction: t });
      await story.update({ reevalCount: nextRound }, { transaction: t });

      await t.commit();

      try {
        const hub  = req.app?.locals?.hub;
        const opId = req.opId || null;

        if (hub) {
          hub.publish(`story:${id}`, {
            type: 'rereview.started',
            storyId: Number(id),
            round: nextRound,
            opId
          });

          const fresh = await Story.findByPk(id);
          hub.publish(`story:${id}`, {
            type: 'story.updated',
            storyId: Number(id),
            version: new Date().toISOString(),
            opId,
            patch: {
              reevalCount: fresh?.reevalCount ?? nextRound,
              updatedAt: fresh?.updatedAt ?? new Date().toISOString()
            }
          });

          hub.publish(`actor:${actor_id}`, {
            type: 'stories.index.patch',
            storyId: Number(id),
            opId,
            patch: { updatedAt: fresh?.updatedAt ?? new Date().toISOString() }
          });
        }
      } catch (e) {
        console.warn('[ws publish story.rereviewStart] fail:', e?.message || e);
      }

      return res.json({ round: nextRound });
    } catch (e) { await t.rollback(); next(e); }
  }
}

module.exports = new StoryController();
