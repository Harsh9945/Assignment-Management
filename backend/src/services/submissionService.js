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

  // 3. Server re-checks eligibility
  const isEligible = await assignmentRepo.isStudentEligible(assignmentId, studentId, groupId);
  if (!isEligible) {
    const error = new Error('Forbidden: You are not eligible to submit this assignment');
    error.statusCode = 403;
    throw error;
  }

  // 4. Branch on submission type
  if (assignment.submission_type === 'GROUP') {
    if (!activeGroup) {
      const error = new Error('You must create or join a group before submitting a group assignment');
      error.statusCode = 400;
      throw error;
    }

    if (activeGroup.owner_id !== studentId) {
      const error = new Error('Forbidden: Only the group leader can acknowledge group submissions');
      error.statusCode = 403;
      throw error;
    }

    const submissions = await submissionRepo.upsertGroupSubmissions({
      assignmentId,
      groupId: activeGroup.id,
      leaderId: studentId
    });

    return {
      message: 'Group submission confirmed for all group members',
      submissions
    };
  } else {
    // Individual submission
    const submission = await submissionRepo.upsertSubmission({
      assignmentId,
      studentId,
      groupId,
      confirmedBy: studentId
    });

    return {
      message: 'Submission confirmed successfully',
      submission: {
        id: submission.id,
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        groupId: submission.group_id,
        confirmedBy: submission.confirmed_by,
        status: submission.status,
        confirmedAt: submission.confirmed_at
      }
    };
  }
}

async function getMySubmission(studentId, assignmentId) {
  const submission = await submissionRepo.findByStudentAndAssignment(studentId, assignmentId);
  return {
    assignmentId,
    studentId,
    status: submission ? submission.status : 'PENDING',
    confirmedAt: submission ? submission.confirmed_at : null,
    confirmedBy: submission ? submission.confirmed_by_name : null
  };
}

module.exports = {
  confirmSubmission,
  getMySubmission
};
