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
  role: u.role,
  isVerified: u.isVerified,
});

class AdminController {
  async listUsers(req, res) {
    const { query = '', limit = 50, offset = 0 } = req.query;

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
        'role', 'isVerified',
      ],
    });

    const withCounts = [];
    for (const u of rows) {
      let actorId = null;
      const link = await IdentityLink.findOne({ where: { user_id: u.id }, attributes: ['cipher_blob'] });
      if (link) {
        try { actorId = decryptLink(link.cipher_blob)?.actor_id || null; } catch {}
      }
      const storyCount = actorId ? await Story.count({ where: { actor_id: actorId } }) : 0;
      withCounts.push({ ...pickUser(u), storyCount });
    }

    return res.json({ count, items: withCounts });
  }
}

module.exports = new AdminController();
