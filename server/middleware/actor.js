const { IdentityLink } = require('../models/models');
const { decryptLink } = require('../utils/cryptoIdentity');

async function attachActorId(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Не авторизован' });

    const link = await IdentityLink.findOne({ where: { user_id: uid } });
    if (!link) return res.status(400).json({ message: 'Нет связки user → actor' });

    let actor_id = null;
    try {
      const dec = decryptLink(link.cipher_blob);
      actor_id = dec?.actor_id || null;
    } catch {}
    if (!actor_id) return res.status(400).json({ message: 'Некорректный cipher_blob' });

    req.actorId = actor_id;        
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = { attachActorId };
