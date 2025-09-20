const { Router } = require('express');
const router = Router();
const ideaController = require('../controllers/ideaController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

router.get('/story/:storyId', authMiddleware, [v.storyIdParam], validate, ideaController.listForStory);
router.post('/story/:storyId', authMiddleware, [v.storyIdParam, v.text, v.score, v.sortOrder], validate, ideaController.createForStory);
router.patch('/:id', authMiddleware, [v.idParam], validate, ideaController.update);
router.delete('/:id', authMiddleware, [v.idParam], validate, ideaController.remove);

module.exports = router;
