// server/routes/userRouter.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Auth
router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.get('/check', authMiddleware, userController.check);

// Email verification
router.get('/verify', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);
router.get('/verify-status', userController.verifyStatus); // <— новый

router.get('/activation-landing', userController.activationLanding);

// запрос сброса
router.post('/password/reset', userController.requestPasswordReset);

// переход из письма
router.get('/password-reset', userController.passwordResetFromEmail);

// гейты
router.get('/password/reset/gate', userController.passwordResetGate);
router.post('/password/reset/confirm', userController.passwordResetConfirm);
router.get('/password/reset/sent-gate', userController.passwordResetSentGate);
router.get('/password/reset/success-gate', userController.passwordResetSuccessGate);



module.exports = router;
