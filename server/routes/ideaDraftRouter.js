const { Router } = require('express');
const router = Router();

const drafts = require('../controllers/ideaDraftController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');
const { attachOpId }   = require('../middleware/opId');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

const toFns = (x) => Array.isArray(x) ? x : (typeof x === 'function' ? [x] : []);

router.get('/', auth, attachActorId, drafts.list);

router.post(
  '/',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.optionalText),
  validate,
  drafts.create
);

router.patch(
  '/:id',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  ...toFns(v.optionalText),
  ...toFns(v.optionalSortOrder),
  validate,
  drafts.update
);

router.delete(
  '/:id',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  validate,
  drafts.remove
);

router.post(
  '/:id/move',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  ...toFns(v.targetStoryIdBody),
  validate,
  drafts.move
);

router.post(
  '/:id/create-story',
  auth,
  attachActorId,
  attachOpId,
  ...toFns(v.idParam),
  ...toFns(v.additionalIdsArray),
  validate,
  drafts.createStory
);

module.exports = router;
