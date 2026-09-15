const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate, createGroupSchema, addMemberSchema } = require('../middleware/validate');

// All group routes require authentication
router.use(verifyToken);

// Create group - only students
router.post('/', requireRole('STUDENT'), validate(createGroupSchema), groupController.createGroup);

// Get current student's group
router.get('/me', requireRole('STUDENT'), groupController.getMyGroup);

// Add member to group - owner only checked in service
router.post('/:id/members', requireRole('STUDENT'), validate(addMemberSchema), groupController.addMember);

// Remove member from group - owner only checked in service
router.delete('/:id/members/:userId', requireRole('STUDENT'), groupController.removeMember);

// Get group progress for a specific assignment - authenticated
router.get('/:id/progress', groupController.getGroupProgress);

module.exports = router;
