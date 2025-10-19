const { Router } = require('express');
const router = Router();

const adminController = require('../controllers/adminController');

router.get('/users', adminController.listUsers);

module.exports = router;
