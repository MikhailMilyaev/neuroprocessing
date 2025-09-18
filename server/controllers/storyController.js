// server/controllers/storyController.js
const { Story, Idea, Reeval, ReevalItem } = require('../models/models');
const sequelize = require('../db');
const { Op } = require('sequelize');

class StoryController {
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { title = 'Новая история', content = '' } = req.body || {};
      const story = await Story.create({ userId, title, content, archive: false });
      return res.json(story);
    } catch (e) { next(e); }
  }

  /**
   * GET /api/story
   * Параметры:
   *  - archive=true|false (опционально, без параметра — все)
   *  - limit=50 (1..200)
   *  - cursor=<ISO date> (updatedAt строго меньше)
   *  - fields=id,title,updatedAt,archive,reevalDueAt (опционально)
   *
   * Возврат:
   *  { rows: [...], meta: { nextCursor, hasMore } }
   */
  async list(req, res, next) {
    try {
      const userId = req.user.id;

      const archiveParam = req.query.archive;
      const limitParam   = Number.parseInt(req.query.limit, 10);
      const cursorParam  = req.query.cursor;
      const fieldsParam  = typeof req.query.fields === 'string' ? req.query.fields : null;

      const where = { userId };

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

      // Белый список полей
      const allowed = new Set([
        'id', 'title', 'content', 'archive', 'userId',
        'updatedAt', 'createdAt', 'reevalDueAt',
        'stopContentY', 'baselineContent', 'reevalCount',
        'showArchiveSection', 'lastViewContentY',
        'remindersEnabled', 'remindersFreqSec', 'remindersIndex', 'remindersPaused',
      ]);
      let attributes;
      if (fieldsParam) {
        const reqFields = fieldsParam
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
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
      const userId = req.user.id;
      const { id } = req.params;
      const story = await Story.findOne({ where: { id, userId } });
      if (!story) return res.status(404).json({ message: 'История не найдена' });
      return res.json(story);
    } catch (e) { next(e); }
  }

  /**
   * NEW: GET /api/story/:id/full
   * Атомарный ответ: история + все идеи (в стабильном порядке)
   */
  async getFull(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const story = await Story.findOne({ where: { id, userId } });
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const ideas = await Idea.findAll({
        where: { storyId: id },
        order: [
          // стабильный порядок на клиент: сначала активные/архив группируются уже в UI,
          // но сортировка внутри групп стабильна
          ['sortOrder', 'DESC'],
          ['id', 'DESC'],
        ],
      });

      return res.json({
        story,
        ideas,
      });
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const {
        title,
        content,
        archive,
        baselineContent,

        showArchiveSection,
        showArchive,

        remindersEnabled,
        remindersFreqSec,
        remindersPaused,
        remindersIndex,

        lastViewContentY,

        reevalDueAt,
      } = req.body;

      const updateData = {};

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (archive !== undefined) updateData.archive = archive;
      if (baselineContent !== undefined) updateData.baselineContent = baselineContent;

      if (showArchiveSection !== undefined || showArchive !== undefined) {
        const v = (showArchiveSection !== undefined) ? showArchiveSection : showArchive;
        updateData.showArchiveSection = (v === true || v === 'true' || v === 1 || v === '1');
      }

      if (remindersEnabled !== undefined) {
        const v = remindersEnabled;
        updateData.remindersEnabled = (v === true || v === 'true' || v === 1 || v === '1');
      }
      if (remindersPaused !== undefined) {
        const v = remindersPaused;
        updateData.remindersPaused = (v === true || v === 'true' || v === 1 || v === '1');
      }
      if (remindersFreqSec !== undefined) {
        if (remindersFreqSec == null || remindersFreqSec === 'null' || remindersFreqSec === '') {
          updateData.remindersFreqSec = null;
        } else {
          const n = Number(remindersFreqSec);
          updateData.remindersFreqSec = Number.isFinite(n) ? n : null;
        }
      }
      if (remindersIndex !== undefined) {
        const n = Number(remindersIndex);
        updateData.remindersIndex = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
      }

      if (lastViewContentY !== undefined) {
        const n = Number(lastViewContentY);
        if (Number.isFinite(n)) {
          updateData.lastViewContentY = Math.max(0, Math.round(n));
        }
      }

      if (reevalDueAt !== undefined) {
        if (reevalDueAt === null || reevalDueAt === 'null' || reevalDueAt === '') {
          updateData.reevalDueAt = null;
        } else {
          const d = new Date(reevalDueAt);
          updateData.reevalDueAt = isNaN(d.getTime()) ? null : d;
        }
      }

      const [count, rows] = await Story.update(
        updateData,
        { where: { id, userId }, returning: true }
      );

      if (!count) return res.status(404).json({ message: 'История не найдена' });
      return res.json(rows[0]);
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const count = await Story.destroy({ where: { id, userId } });
      if (!count) return res.status(404).json({ message: 'История не найдена' });
      return res.json({ ok: true });
    } catch (e) { next(e); }
  }

  async setStop(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { stopContentY } = req.body;

    if (typeof stopContentY !== 'number')
        return res.status(400).json({ message: 'stopContentY must be a number' });

      const [count, rows] = await Story.update(
        { stopContentY },
        { where: { id, userId }, returning: true }
      );
      if (!count) return res.status(404).json({ message: 'История не найдена' });
      return res.json(rows[0]);
    } catch (e) { next(e); }
  }

  async clearStop(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const [count, rows] = await Story.update(
        { stopContentY: null },
        { where: { id, userId }, returning: true }
      );
      if (!count) return res.status(404).json({ message: 'История не найдена' });
      return res.json(rows[0]);
    } catch (e) { next(e); }
  }

  // === Переоценка (обычный цикл) ===
  async reeval(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const story = await Story.findOne({ where: { id, userId }, transaction: t });
      if (!story) {
        await t.rollback();
        return res.status(404).json({ message: 'История не найдена' });
      }

      const ideas = await Idea.findAll({
        where: { storyId: id },
        order: [['sortOrder', 'ASC']],
        transaction: t
      });

      const isArchived = (b) => b.score !== null && b.score === 0;
      const active = ideas.filter(b => !isArchived(b));
      const allActiveScored =
        active.length === 0 ||
        active.every(b => Number.isFinite(b.score) && b.score >= 1 && b.score <= 10);

      if (!allActiveScored) {
        await t.rollback();
        return res.status(400).json({ message: 'Оцените весь список идей' });
      }

      const nextRound = (story.reevalCount || 0) + 1;

      const reeval = await Reeval.create({ storyId: story.id, round: nextRound }, { transaction: t });

      const items = ideas.map(b => ({
        reevalId: reeval.id,
        ideaId: b.id,
        score: b.score === null ? null : Number(b.score)
      }));
      if (items.length) {
        await ReevalItem.bulkCreate(items, { transaction: t });
      }

      if (active.length) {
        const ids = active.map(b => b.id);
        await Idea.update({ score: null }, { where: { id: ids }, transaction: t });
      }

      await story.update(
        { reevalCount: nextRound, baselineContent: story.content },
        { transaction: t }
      );

      await t.commit();
      return res.json({ round: nextRound });
    } catch (e) {
      await t.rollback();
      next(e);
    }
  }

  // === Старт «Пересмотра» для АРХИВНОЙ истории ===
  async rereviewStart(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const story = await Story.findOne({ where: { id, userId }, transaction: t });
      if (!story) {
        await t.rollback();
        return res.status(404).json({ message: 'История не найдена' });
      }
      if (!story.archive) {
        await t.rollback();
        return res.status(400).json({ message: 'История не в архиве' });
      }

      const ideas = await Idea.findAll({
        where: { storyId: id },
        order: [['sortOrder', 'ASC']],
        transaction: t
      });

      const nextRound = (story.reevalCount || 0) + 1;

      const reeval = await Reeval.create({ storyId: story.id, round: nextRound }, { transaction: t });
      if (ideas.length) {
        await ReevalItem.bulkCreate(
          ideas.map(b => ({
            reevalId: reeval.id,
            ideaId: b.id,
            score: b.score == null ? null : Number(b.score),
          })),
          { transaction: t }
        );
      }

      await Idea.update(
        { score: null },
        { where: { storyId: id }, transaction: t }
      );

      // ⛔️ НЕ трогаем reevalDueAt!
      await story.update(
        { reevalCount: nextRound, baselineContent: story.content },
        { transaction: t }
      );

      await t.commit();
      return res.json({ round: nextRound });
    } catch (e) {
      await t.rollback();
      next(e);
    }
  }
}

module.exports = new StoryController();
