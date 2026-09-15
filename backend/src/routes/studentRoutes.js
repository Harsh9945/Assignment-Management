const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/search', studentController.searchStudents);

module.exports = router;
