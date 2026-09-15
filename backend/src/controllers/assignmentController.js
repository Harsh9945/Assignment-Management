const assignmentService = require('../services/assignmentService');
const submissionService = require('../services/submissionService');

async function createAssignment(req, res, next) {
  try {
    const assignment = await assignmentService.createAssignment(req.user.id, req.body);
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const assignments = await assignmentService.listAssignmentsForUser(req.user);
    res.status(200).json({ assignments });
  } catch (err) {
    next(err);
  }
}

async function getAssignmentById(req, res, next) {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id, req.user);
    res.status(200).json({ assignment });
  } catch (err) {
    next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body);
    res.status(200).json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function confirmSubmission(req, res, next) {
  try {
    const result = await submissionService.confirmSubmission(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMySubmission(req, res, next) {
  try {
    const result = await submissionService.getMySubmission(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssignment,
  listAssignments,
  getAssignmentById,
  updateAssignment,
  confirmSubmission,
  getMySubmission
};
