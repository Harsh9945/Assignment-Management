const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All admin routes require ADMIN role
router.use(verifyToken, requireRole('ADMIN'));

// Dashboard summary counts and chart data
router.get('/dashboard/summary', adminController.getDashboardSummary);

// Group-wise and student-wise progress breakdown for an assignment
router.get('/assignments/:id/progress', adminController.getAssignmentProgress);

// All groups list (for assignment targeting UI)
router.get('/groups', adminController.getAllGroups);

module.exports = router;
