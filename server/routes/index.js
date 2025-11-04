const { Router } = require('express');
const router = Router();

const user = require('./userRouter');
const story = require('./storyRouter');
const ideaDraftRouter = require('./ideaDraftRouter');
const storyIdeaRouter = require('./storyIdeaRouter');
const admin = require('./adminRouter');
const practiceRunsRouter = require('./practiceRuns'); 

const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');

router.use('/user', user);

router.use('/story',        authMiddleware, story);
router.use('/story-ideas',  authMiddleware, storyIdeaRouter);
router.use('/idea-drafts',  authMiddleware, ideaDraftRouter);

router.use('/practice-runs', authMiddleware, practiceRunsRouter);  

router.use('/admin', authMiddleware, adminOnly(), admin);

module.exports = router;
