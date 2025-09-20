const { Idea, Story } = require('../models/models');

async function ensureStoryOwner(storyId, userId) {
  const story = await Story.findOne({ where: { id: storyId, userId } });
  return !!story;
}

class IdeaController {
  async listForStory(req, res, next) {
    try {
      const userId = req.user?.id;
      const { storyId } = req.params;

      const sid = Number(storyId);
      if (!Number.isFinite(sid)) {
        return res.status(400).json({ message: 'Некорректный storyId' });
      }

      const owned = await ensureStoryOwner(sid, userId);
      if (!owned) return res.status(404).json({ message: 'История не найдена' });

      const ideas = await Idea.findAll({
        where: { storyId: sid },
        order: [
          ['sortOrder', 'DESC'],
          ['id', 'DESC'],
        ],
      });

      return res.json(ideas || []);
    } catch (e) {
      console.error('Ошибка при listForStory:', e);
      return next(e);
    }
  }

  async createForStory(req, res, next) {
    try {
      const userId = req.user?.id;
      const { storyId } = req.params;
      const sid = Number(storyId);
      if (!Number.isFinite(sid)) {
        return res.status(400).json({ message: 'Некорректный storyId' });
      }

      const {
        text = '',
        score = null,            
        introducedRound = 0,     
        sortOrder,               
      } = req.body || {};

      const owned = await ensureStoryOwner(sid, userId);
      if (!owned) return res.status(404).json({ message: 'История не найдена' });

      const preparedScore =
        score == null || score === '' ? null : Number(score);

      if (preparedScore != null && (preparedScore < 0 || preparedScore > 10)) {
        return res.status(400).json({ message: 'score должен быть от 0 до 10' });
      }

      const created = await Idea.create({
        storyId: sid,
        text: String(text || ''),
        score: preparedScore,
        introducedRound: Number.isFinite(+introducedRound) ? +introducedRound : 0,
        sortOrder: Number.isFinite(+sortOrder) ? +sortOrder : Date.now(),
      });

      return res.json(created);
    } catch (e) {
      console.error('Ошибка при createForStory:', e);
      return next(e);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const idea = await Idea.findByPk(id, {
        include: { model: Story, as: 'story' },
      });
      if (!idea || idea?.story?.userId !== userId) {
        return res.status(404).json({ message: 'Убеждение не найдено' });
      }

      const { text, score, sortOrder, introducedRound } = req.body || {};
      const patch = {};

      if (text !== undefined) {
        patch.text = String(text);
      }

      let newScoreNorm;
      const scoreProvided = score !== undefined;

      if (scoreProvided) {
        const s = score == null || score === '' ? null : Number(score);
        if (s != null && (s < 0 || s > 10)) {
          return res.status(400).json({ message: 'score должен быть от 0 до 10' });
        }
        patch.score = s;
        newScoreNorm = s;
      }

      if (scoreProvided) {
        const wasArchived = idea.score === 0;
        const becomesArchived = newScoreNorm === 0;
        if (wasArchived !== becomesArchived) {
          patch.sortOrder = Date.now();
        }
      }

      if (sortOrder !== undefined) patch.sortOrder = Number(sortOrder);
      if (introducedRound !== undefined) patch.introducedRound = Number(introducedRound);

      await idea.update(patch);
      return res.json(idea);
    } catch (e) {
      console.error('Ошибка при update idea:', e);
      return next(e);
    }
  }

  async remove(req, res, next) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const idea = await Idea.findByPk(id, {
        include: { model: Story, as: 'story' },
      });

      if (!idea || idea?.story?.userId !== userId) {
        return res.status(404).json({ message: 'Убеждение не найдено' });
      }

      await idea.destroy();
      return res.json({ ok: true });
    } catch (e) {
      console.error('Ошибка при remove idea:', e);
      return next(e);
    }
  }
}

module.exports = new IdeaController();
