const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// List user's courses (Taught for admin, Enrolled for student)
router.get('/', courseController.getMyCourses);

// Create course - Admin only
router.post('/', requireRole('ADMIN'), courseController.createCourse);

// Get course details by ID
router.get('/:id', courseController.getCourseById);

// Enroll student into course - Admin only
router.post('/:id/enroll', requireRole('ADMIN'), courseController.enrollStudent);

// Get assignments for a specific course
router.get('/:id/assignments', courseController.getCourseAssignments);

// Get analytics for a specific course - Admin only
router.get('/:id/analytics', requireRole('ADMIN'), courseController.getCourseAnalytics);

module.exports = router;
