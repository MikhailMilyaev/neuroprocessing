const { Router } = require('express');
const router = Router();

const user = require('./userRouter');
const story = require('./storyRouter');
const ideaDraftRouter = require('./ideaDraftRouter');
const storyIdeaRouter = require('./storyIdeaRouter');
const practiceRunsRouter = require('./practiceRuns'); 

const authMiddleware = require('../middleware/authMiddleware');

router.use('/user', user);

router.use('/story',        authMiddleware, story);
router.use('/story-ideas',  authMiddleware, storyIdeaRouter);
router.use('/idea-drafts',  authMiddleware, ideaDraftRouter);

router.use('/practice-runs', authMiddleware, practiceRunsRouter);  

module.exports = router;
