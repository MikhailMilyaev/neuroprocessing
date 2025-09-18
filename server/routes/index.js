const { Router } = require('express');
const router = Router();

const user = require('./userRouter');
const story = require('./storyRouter');
const inboxIdeaRouter = require('./inboxIdeaRouter');
const sttRouter = require('./sttRouter');
const idea = require('./ideaRouter');

router.use('/user', user);
router.use('/story', story);
router.use('/stt', sttRouter);
router.use('/idea', idea);
router.use('/inbox-idea', inboxIdeaRouter);


module.exports = router;
