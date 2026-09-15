const submissionRepo = require('../repositories/submissionRepo');
const assignmentRepo = require('../repositories/assignmentRepo');
const groupRepo = require('../repositories/groupRepo');

async function confirmSubmission(studentId, assignmentId) {
  // 1. Verify assignment exists
  const assignment = await assignmentRepo.findById(assignmentId);
  if (!assignment) {
    const error = new Error('Assignment not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Determine student's active group
  const activeGroup = await groupRepo.findUserActiveGroup(studentId);
  const groupId = activeGroup ? activeGroup.id : null;

  // 3. FR-06.4: Server re-checks eligibility
  const isEligible = await assignmentRepo.isStudentEligible(assignmentId, studentId, groupId);
  if (!isEligible) {
    const error = new Error('Forbidden: You are not eligible to submit this assignment');
    error.statusCode = 403;
    throw error;
  }

  // 4. FR-06.2 & FR-06.3: Persist confirmation idempotently
  const submission = await submissionRepo.upsertSubmission({
    assignmentId,
    studentId,
    groupId
  });

  return {
    message: 'Submission confirmed successfully',
    submission: {
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentId: submission.student_id,
      groupId: submission.group_id,
      status: submission.status,
      confirmedAt: submission.confirmed_at
    }
  };
}

async function getMySubmission(studentId, assignmentId) {
  const submission = await submissionRepo.findByStudentAndAssignment(studentId, assignmentId);
  return {
    assignmentId,
    studentId,
    status: submission ? submission.status : 'PENDING',
    confirmedAt: submission ? submission.confirmed_at : null
  };
}

module.exports = {
  confirmSubmission,
  getMySubmission
};
