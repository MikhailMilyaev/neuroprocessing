// server/controllers/adminController.js
const { Op } = require('sequelize');
const { User, IdentityLink, Story } = require('../models/models');
const { decryptLink } = require('../utils/cryptoIdentity');

const pickUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  phoneVerified: u.phoneVerified,
  createdAt: u.createdAt,
  subscriptionStatus: u.subscriptionStatus,
  trialEndsAt: u.trialEndsAt,
  subscriptionEndsAt: u.subscriptionEndsAt,
  role: u.role,            // добавили
  isVerified: u.isVerified // добавили
});

function addDays(date, days) {
  const base = new Date(date);
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

class AdminController {
  // GET /api/admin/users?query=&limit=50&offset=0
  // >>> Возвращаем ВСЕХ пользователей (без фильтра по подписке/триалу).
  // Поиск работает по email/name/phone.
  async listUsers(req, res) {
    const { query = '', limit = 50, offset = 0 } = req.query;

    // Поисковый фильтр (без фильтра по доступу)
    const searchClause = query
      ? {
          [Op.or]: [
            { email: { [Op.iLike]: `%${query}%` } },
            { name:  { [Op.iLike]: `%${query}%` } },
            { phone: { [Op.iLike]: `%${query}%` } },
          ],
        }
      : {};

    const { rows, count } = await User.findAndCountAll({
      where: searchClause,
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
      attributes: [
        'id', 'name', 'email', 'phone', 'phoneVerified', 'createdAt',
        'subscriptionStatus', 'trialEndsAt', 'subscriptionEndsAt',
        'role', 'isVerified',
      ],
    });

    // storyCount через identity_links → actor_id
    const withCounts = [];
    for (const u of rows) {
      let actorId = null;
      const link = await IdentityLink.findOne({
        where: { user_id: u.id },
        attributes: ['cipher_blob'],
      });
      if (link) {
        try {
          actorId = decryptLink(link.cipher_blob)?.actor_id || null;
        } catch {}
      }

      let storyCount = 0;
      if (actorId) {
        storyCount = await Story.count({ where: { actor_id: actorId } });
      }

      withCounts.push({ ...pickUser(u), storyCount });
    }

    return res.json({ count, items: withCounts });
  }

  // POST /api/admin/users/:id/grant
  // body: { days?: number } — по умолчанию 30
  async grantSubscription(req, res) {
    const id = Number(req.params.id);
    const days = Math.max(Number(req.body?.days || 30), 1);

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'not found' });

    const now = new Date();
    const base =
      user.subscriptionStatus === 'active' &&
      user.subscriptionEndsAt &&
      now < user.subscriptionEndsAt
        ? new Date(user.subscriptionEndsAt)
        : now;

    user.subscriptionStatus = 'active';
    user.subscriptionEndsAt = addDays(base, days);
    await user.save();

    return res.json({
      ok: true,
      user: pickUser(user),
    });
  }
}

module.exports = new AdminController();
