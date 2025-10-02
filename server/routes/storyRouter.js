const { Router } = require('express');
const router = Router();

const storyController = require('../controllers/storyController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');
const { attachOpId } = require('../middleware/opId');

router.post('/',              auth, attachActorId, attachOpId, storyController.create);
router.get('/',               auth, attachActorId, storyController.list);
router.get('/slug/:slug',     auth, attachActorId, storyController.getBySlug);
router.get('/:id',            auth, attachActorId, storyController.getOne);
router.get('/:id/full',       auth, attachActorId, storyController.getFull);
router.put('/:id',            auth, attachActorId, attachOpId, storyController.update);
router.delete('/:id',         auth, attachActorId, attachOpId, storyController.remove);
router.put('/:id/stop',       auth, attachActorId, attachOpId, storyController.setStop);
router.delete('/:id/stop',    auth, attachActorId, attachOpId, storyController.clearStop);
router.post('/:id/reevaluate',      auth, attachActorId, attachOpId, storyController.reeval);
router.post('/:id/rereview-start',  auth, attachActorId, attachOpId, storyController.rereviewStart);

module.exports = router;
