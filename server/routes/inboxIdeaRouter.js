const Router = require('express');
const router = new Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/inboxIdeaController');

router.get('/', authMiddleware, ctrl.list);
router.post('/', authMiddleware, ctrl.create);
router.patch('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

router.post('/:id/move', authMiddleware, ctrl.moveToStory);
router.post('/:id/create-story', authMiddleware, ctrl.createStoryAndMove);

module.exports = router;
