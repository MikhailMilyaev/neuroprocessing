const { Router } = require('express');
const router = Router();

const inbox = require('../controllers/inboxIdeaController');
const auth = require('../middleware/authMiddleware');
const { attachActorId } = require('../middleware/actor');
const { attachOpId }   = require('../middleware/opId');          // ✅ ВАЖНО: импорт
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

const toFns = (x) => Array.isArray(x) ? x : (typeof x === 'function' ? [x] : []);

// Список инбокса
router.get(
  '/',
  auth,
  attachActorId,
  inbox.list
);

// Создать запись инбокса
router.post(
  '/',
  auth,
  attachActorId,
  attachOpId,                           // ✅ оп-id в заголовок
  ...toFns(v.optionalText),
  validate,
  inbox.create
);

// Обновить запись инбокса
router.patch(
  '/:id',
  auth,
  attachActorId,
  attachOpId,                           // ✅
  ...toFns(v.idParam),
  ...toFns(v.optionalText),
  ...toFns(v.optionalSortOrder),
  validate,
  inbox.update
);

// Удалить запись инбокса
router.delete(
  '/:id',
  auth,
  attachActorId,
  attachOpId,                           // ✅
  ...toFns(v.idParam),
  validate,
  inbox.remove
);

// Перенос ОДНОЙ записи в существующую историю
router.post(
  '/:id/move',
  auth,
  attachActorId,
  attachOpId,                           // ✅
  ...toFns(v.idParam),
  ...toFns(v.targetStoryIdBody),        // ✅ нужен для body.targetStoryId
  validate,
  inbox.move
);

// Создать НОВУЮ историю из выбранных (id из params + additionalIds[] из body)
router.post(
  '/:id/create-story',
  auth,
  attachActorId,
  attachOpId,                           // ✅
  ...toFns(v.idParam),
  ...toFns(v.additionalIdsArray),       // ✅ additionalIds: number[]
  validate,
  inbox.createStory
);

module.exports = router;
