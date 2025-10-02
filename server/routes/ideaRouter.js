const { Router } = require('express');
const router = Router();

const idea = require('../controllers/ideaController');
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
  idea.listForStory
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
  idea.create
);

router.patch(
  '/:id',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  validate,
  idea.update
);

router.delete(
  '/:id',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  validate,
  idea.remove
);

router.post(
  '/reorder',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.storyIdBody),
  ...toFns(v.orderArray),
  validate,
  idea.reorder
);

module.exports = router;
