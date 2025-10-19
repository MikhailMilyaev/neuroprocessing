const { Router } = require('express');
const router = Router();

const storyIdea = require('../controllers/storyIdeaController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');
const { attachOpId } = require('../middleware/opId');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

const toFns = (x) => Array.isArray(x) ? x : (typeof x === 'function' ? [x] : []);

router.get(
  '/story/:storyId',
  auth,
  attachActorId,
  ...toFns(v.storyIdParam),
  validate,
  storyIdea.listForStory
);

router.post(
  '/story/:storyId',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.storyIdParam),
  ...toFns(v.text),
  ...toFns(v.score),
  ...toFns(v.sortOrder),
  validate,
  storyIdea.create
);

router.patch(
  '/:id',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  validate,
  storyIdea.update
);

router.delete(
  '/:id',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  validate,
  storyIdea.remove
);

router.post(
  '/reorder',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.storyIdBody),
  ...toFns(v.orderArray),
  validate,
  storyIdea.reorder
);

module.exports = router;
