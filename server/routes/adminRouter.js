const { Router } = require('express');
const router = Router();
const auth = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const adminController = require('../controllers/adminController');

router.get('/users', auth, adminOnly(), adminController.listUsers);
router.post('/users/:id/grant', auth, adminOnly(), adminController.grantSubscription);

module.exports = router;
