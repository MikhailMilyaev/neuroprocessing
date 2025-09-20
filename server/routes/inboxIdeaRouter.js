const { Router } = require('express');
const router = new Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/inboxIdeaController');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

router.get('/', authMiddleware, ctrl.list);
router.post('/', authMiddleware, [v.text], validate, ctrl.create);
router.patch('/:id', authMiddleware, [v.idParam, v.text, v.sortOrder], validate, ctrl.update);
router.delete('/:id', authMiddleware, [v.idParam], validate, ctrl.remove);
router.post('/:id/move', authMiddleware, [v.idParam], validate, ctrl.moveToStory);
router.post('/:id/create-story', authMiddleware, [v.idParam], validate, ctrl.createStoryAndMove);

module.exports = router;
