const { Router } = require('express');
const router = Router();

const storyController = require('../controllers/storyController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');    

router.post('/',              auth, attachActorId, storyController.create);
router.get('/',               auth, attachActorId, storyController.list);
router.get('/slug/:slug',     auth, attachActorId, storyController.getBySlug);
router.get('/:id',            auth, attachActorId, storyController.getOne);
router.get('/:id/full',       auth, attachActorId, storyController.getFull);
router.put('/:id',            auth, attachActorId, storyController.update);
router.delete('/:id',         auth, attachActorId, storyController.remove);
router.put('/:id/stop',       auth, attachActorId, storyController.setStop);
router.delete('/:id/stop',    auth, attachActorId, storyController.clearStop);
router.post('/:id/reevaluate',      auth, attachActorId, storyController.reeval);
router.post('/:id/rereview-start',  auth, attachActorId, storyController.rereviewStart);

module.exports = router;
