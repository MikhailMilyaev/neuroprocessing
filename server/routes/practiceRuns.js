const router = require('express').Router();
const ctrl = require('../controllers/practiceRunController');

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'unauthorized' });
  next();
}
router.use(requireAuth);

router.get('/', ctrl.list);

router.post('/', ctrl.create);

router.patch('/:id', ctrl.update);

router.delete('/:id', ctrl.remove);

router.delete('/', ctrl.removeByKey);

module.exports = router;
