const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, emailFlowLimiter, refreshLimiter } = require('../middleware/limits');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');
const enforceOrigin = require('../middleware/enforceOrigin');

router.post(
  '/registration',
  authLimiter,
  [v.name, v.email, v.password],
  validate,
  userController.registration
);

router.post('/login', enforceOrigin, authLimiter, [v.email, v.password, v.deviceId], validate, userController.login);
router.get('/check', authMiddleware, userController.check);

router.post('/token/refresh', enforceOrigin, refreshLimiter, [v.deviceId], validate, userController.refresh);
router.post('/logout', enforceOrigin, userController.logout);
router.post('/logout-all', enforceOrigin, authMiddleware, userController.logoutAll);
router.get('/me', authMiddleware, userController.me);
router.get('/verify', emailFlowLimiter, userController.verifyEmail);
router.post('/resend-verification', emailFlowLimiter, userController.resendVerification);
router.get('/verify-status', emailFlowLimiter, [v.verifyEmailQuery], validate, userController.verifyStatus);

router.get('/activation-landing', userController.activationLanding);

router.post('/password/reset', emailFlowLimiter, [v.email], validate, userController.requestPasswordReset);
router.get('/password-reset', emailFlowLimiter, userController.passwordResetFromEmail);
router.get('/password/reset/gate', emailFlowLimiter, userController.passwordResetGate);
router.post('/password/reset/confirm', emailFlowLimiter, [v.newPassword], validate, userController.passwordResetConfirm);
router.get('/password/reset/sent-gate', emailFlowLimiter, userController.passwordResetSentGate);
router.get('/password/reset/success-gate', emailFlowLimiter, userController.passwordResetSuccessGate);

router.get('/sessions', authMiddleware, userController.listSessions);
router.post('/sessions/revoke', authMiddleware, userController.revokeSession);

module.exports = router;
