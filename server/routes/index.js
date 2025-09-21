const { Router } = require('express');
const router = Router();

const user = require('./userRouter');
const story = require('./storyRouter');
const inboxIdeaRouter = require('./inboxIdeaRouter');
const idea = require('./ideaRouter');

router.use('/user', user);
router.use('/story', story);
router.use('/idea', idea);
router.use('/fast-idea', inboxIdeaRouter);

module.exports = router;