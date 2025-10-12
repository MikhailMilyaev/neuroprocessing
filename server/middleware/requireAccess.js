const { User } = require('../models/models');

module.exports = function requireAccess() {
  return async (req, res, next) => {
    if (!req.user?.id) return res.status(401).json({ error: 'unauthenticated' });

    let u = req.user;
    const needLoad =
      u.subscriptionStatus === undefined ||
      u.trialEndsAt === undefined ||
      u.trialStartedAt === undefined ||
      u.subscriptionEndsAt === undefined;

    if (needLoad) {
      u = await User.findByPk(req.user.id);
      if (!u) return res.status(401).json({ error: 'unauthenticated' });
      req.user = u;
    }

    if (u.role === 'ADMIN') {
      return next();
    }

    const now = new Date();

    // ACTIVE считается валидным, если subscriptionEndsAt отсутствует (бессрочно) или ещё не наступил конец
    const activeOk =
      u.subscriptionStatus === 'active' &&
      (!u.subscriptionEndsAt || now < new Date(u.subscriptionEndsAt));

    const trialOk =
      u.subscriptionStatus === 'trial' &&
      u.trialEndsAt &&
      now < new Date(u.trialEndsAt);

    if (activeOk || trialOk) return next();

    // лениво помечаем как expired
    try {
      if (u.subscriptionStatus !== 'expired') {
        u.subscriptionStatus = 'expired';
        await u.save();
      }
    } catch {}

    return res.status(402).json({
      error: 'trial_expired',
      trialEndsAt: u.trialEndsAt,
      subscriptionStatus: u.subscriptionStatus,
      subscriptionEndsAt: u.subscriptionEndsAt,
      message: 'Access expired',
    });
  };
};
