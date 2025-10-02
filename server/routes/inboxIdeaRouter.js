const { Router } = require('express');
const router = Router();

const inbox = require('../controllers/inboxIdeaController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

const toFns = (x) => Array.isArray(x) ? x : (typeof x === 'function' ? [x] : []);

router.get('/', auth, attachActorId, inbox.list);

router.post(
  '/',
  auth,
  attachActorId,
  ...toFns(v.text),
  validate,
  inbox.create
);

router.patch(
  '/:id',
  auth,
  attachActorId,
  ...toFns(v.idParam),
  validate,
  inbox.update
);

router.delete(
  '/:id',
  auth,
  attachActorId,
  ...toFns(v.idParam),
  validate,
  inbox.remove
);

router.post(
  '/:id/move',
  auth,
  attachActorId,
  ...toFns(v.idParam),
  ...toFns(v.storyIdBody),
  validate,
  inbox.move
);

router.post(
  '/:id/create-story',
  auth,
  attachActorId,
  ...toFns(v.idParam),
  validate,
  inbox.createStory
);

module.exports = router;
