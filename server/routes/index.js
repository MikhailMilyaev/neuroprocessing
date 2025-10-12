const { Router } = require('express');
const router = Router();

const user = require('./userRouter');
const story = require('./storyRouter');
const inboxIdeaRouter = require('./inboxIdeaRouter');
const idea = require('./ideaRouter');
const admin = require('./adminRouter');

const authMiddleware = require('../middleware/authMiddleware');
const requireAccess = require('../middleware/requireAccess');

router.use('/user', user);

router.use('/story',      authMiddleware, requireAccess(), story);
router.use('/idea',       authMiddleware, requireAccess(), idea);
router.use('/fast-idea',  authMiddleware, requireAccess(), inboxIdeaRouter);
router.use('/admin', admin);
module.exports = router;
