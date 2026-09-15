const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  validate,
  createAssignmentSchema,
  updateAssignmentSchema
} = require('../middleware/validate');

// All assignment routes require authentication
router.use(verifyToken);

// Create assignment - Admin only
router.post(
  '/',
  requireRole('ADMIN'),
  validate(createAssignmentSchema),
  assignmentController.createAssignment
);

// List visible assignments for the authenticated user
router.get('/', assignmentController.listAssignments);

// Get assignment details
router.get('/:id', assignmentController.getAssignmentById);

// Update assignment - Admin only
router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate(updateAssignmentSchema),
  assignmentController.updateAssignment
);

// Confirm submission - Student only (two-step final submission confirmation endpoint)
router.post(
  '/:id/confirm-submission',
  requireRole('STUDENT'),
  assignmentController.confirmSubmission
);

// Get current student's submission status for this assignment
router.get(
  '/:id/my-submission',
  requireRole('STUDENT'),
  assignmentController.getMySubmission
);

module.exports = router;
