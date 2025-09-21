const { InboxIdea, Story, Idea } = require('../models/models');

class InboxIdeaController {
  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const ideas = await InboxIdea.findAll({
        where: { userId },
        order: [['sortOrder', 'DESC'], ['id', 'DESC']],
      });
      res.json(ideas || []);
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { text = '' } = req.body || {};
      const row = await InboxIdea.create({
        userId,
        text: String(text || ''),
        sortOrder: Date.now(),
      });
      res.status(201).json(row);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const row = await InboxIdea.findOne({ where: { id, userId } });
      if (!row) return res.status(404).json({ message: 'Идея не найдена' });

      const { text, sortOrder } = req.body || {};
      if (text !== undefined) row.text = String(text);
      if (sortOrder !== undefined) row.sortOrder = Number(sortOrder) || Date.now();
      await row.save();
      res.json(row);
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const count = await InboxIdea.destroy({ where: { id, userId } });
      if (!count) return res.status(404).json({ message: 'Идея не найдена' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  }

  async moveToStory(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { targetStoryId } = req.body || {};
      if (!Number.isFinite(+targetStoryId)) {
        return res.status(400).json({ message: 'Некорректный targetStoryId' });
      }

      const inbox = await InboxIdea.findOne({ where: { id, userId } });
      if (!inbox) return res.status(404).json({ message: 'Идея не найдена' });

      const story = await Story.findOne({ where: { id: targetStoryId, userId } });
      if (!story) return res.status(404).json({ message: 'История не найдена' });

      const created = await Idea.create({
        storyId: story.id,
        text: inbox.text || '',
        score: null,
        introducedRound: 0,
        sortOrder: Date.now(),
      });

      await inbox.destroy();
      res.json({ ok: true, ideaId: created.id, storyId: story.id });
    } catch (e) { next(e); }
  }

  async createStoryAndMove(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const inbox = await InboxIdea.findOne({ where: { id, userId } });
      if (!inbox) return res.status(404).json({ message: 'Идея не найдена' });

      const story = await Story.create({ userId, title: '', content: '', archive: false });
      const idea = await Idea.create({
        storyId: story.id,
        text: inbox.text || '',
        score: null,
        introducedRound: 0,
        sortOrder: Date.now(),
      });

      await inbox.destroy();
      res.status(201).json({ ok: true, storyId: story.id, ideaId: idea.id });
    } catch (e) { next(e); }
  }
}

module.exports = new InboxIdeaController();
