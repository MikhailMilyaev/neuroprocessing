const { Router } = require('express');
const router = Router();
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, storyController.create);
router.get('/', authMiddleware, storyController.list);
router.get('/slug/:slug', authMiddleware, storyController.getBySlug);
router.get('/:id', authMiddleware, storyController.getOne);
router.put('/:id', authMiddleware, storyController.update);
router.delete('/:id', authMiddleware, storyController.remove);
router.get('/:id/full', authMiddleware, storyController.getFull);
router.put('/:id/stop', authMiddleware, storyController.setStop);
router.delete('/:id/stop', authMiddleware, storyController.clearStop);

router.post('/:id/reevaluate', authMiddleware, storyController.reeval);
router.post('/:id/rereview-start', authMiddleware, storyController.rereviewStart);

module.exports = router;
