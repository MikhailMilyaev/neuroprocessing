const { PracticeRun } = require('../models/models');

function slugifyIdea(text = '') {
  const s = String(text || '').trim().toLowerCase();
  const base = s
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9\-_. ]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return encodeURIComponent(base || 'idea');
}

exports.list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const runs = await PracticeRun.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    res.json(runs);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { practiceSlug, ideaText } = req.body || {};
    if (!practiceSlug || !ideaText) {
      return res.status(400).json({ error: 'practiceSlug and ideaText are required' });
    }
    const ideaSlug = slugifyIdea(ideaText);

    const [run] = await PracticeRun.findOrCreate({
      where: { userId, practiceSlug, ideaSlug },
      defaults: { userId, practiceSlug, ideaSlug, ideaText, state: {} },
    });

    res.json(run);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { state } = req.body || {};

    const run = await PracticeRun.findOne({ where: { id: req.params.id, userId } });
    if (!run) return res.sendStatus(404);

    await run.update({ state: { ...(run.state || {}), ...(state || {}) } });
    res.json(run);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const n = await PracticeRun.destroy({ where: { id: req.params.id, userId } });
    res.json({ ok: n > 0 });
  } catch (err) { next(err); }
};

/* Опционально: удаление по комбинации practiceSlug + ideaSlug/ideaText */
exports.removeByKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { practiceSlug, ideaTextOrSlug } = req.body || {};
    if (!practiceSlug || !ideaTextOrSlug) {
      return res.status(400).json({ error: 'practiceSlug and ideaTextOrSlug are required' });
    }
    const looksEncoded = /%[0-9A-Fa-f]{2}/.test(ideaTextOrSlug);
    const ideaSlug = looksEncoded ? ideaTextOrSlug : slugifyIdea(ideaTextOrSlug);

    const n = await PracticeRun.destroy({ where: { userId, practiceSlug, ideaSlug } });
    res.json({ ok: n > 0 });
  } catch (err) { next(err); }
};
