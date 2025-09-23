const { Router } = require('express');
const router = Router();

const idea = require('../controllers/ideaController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');
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
  ...toFns(v.idParam),
  validate,
  idea.update
);

router.delete(
  '/:id',
  auth,
  attachActorId,
  ...toFns(v.idParam),
  validate,
  idea.remove
);

module.exports = router;
