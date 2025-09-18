// server/routes/ideaRouter.js
const { Router } = require('express');
const router = Router();

const ideaController = require('../controllers/ideaController');
const authMiddleware = require('../middleware/authMiddleware');

// Список/создание идей конкретной истории
router.get('/story/:storyId', authMiddleware, ideaController.listForStory);
router.post('/story/:storyId', authMiddleware, ideaController.createForStory);

// Обновление/удаление конкретной идеи
router.patch('/:id', authMiddleware, ideaController.update);
router.delete('/:id', authMiddleware, ideaController.remove);

module.exports = router;
