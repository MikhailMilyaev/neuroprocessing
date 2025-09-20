const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, emailFlowLimiter } = require('../middleware/limits');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

router.post('/registration', authLimiter, [v.name, v.email, v.password], validate, userController.registration);
router.post('/login', authLimiter, [v.email, v.password], validate, userController.login);
router.get('/check', authMiddleware, userController.check);

router.post('/token/refresh', authLimiter, userController.refresh);
router.post('/logout', userController.logout);
router.post('/logout-all', authMiddleware, userController.logoutAll);

router.get('/verify', emailFlowLimiter, userController.verifyEmail);
router.post('/resend-verification', emailFlowLimiter, userController.resendVerification);
router.get('/verify-status', emailFlowLimiter, [v.verifyEmailQuery], validate, userController.verifyStatus);

router.get('/activation-landing', userController.activationLanding);

router.post('/password/reset', emailFlowLimiter, [v.email], validate, userController.requestPasswordReset);
router.get('/password-reset', emailFlowLimiter, userController.passwordResetFromEmail);
router.get('/password/reset/gate', emailFlowLimiter, userController.passwordResetGate);
router.post('/password/reset/confirm', emailFlowLimiter, [v.password], validate, userController.passwordResetConfirm);
router.get('/password/reset/sent-gate', emailFlowLimiter, userController.passwordResetSentGate);
router.get('/password/reset/success-gate', emailFlowLimiter, userController.passwordResetSuccessGate);

module.exports = router;
