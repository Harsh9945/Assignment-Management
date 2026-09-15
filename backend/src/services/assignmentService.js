const assignmentRepo = require('../repositories/assignmentRepo');
const groupRepo = require('../repositories/groupRepo');
const submissionRepo = require('../repositories/submissionRepo');

async function createAssignment(adminUserId, data) {
  const assignment = await assignmentRepo.createAssignment({
    title: data.title,
    description: data.description,
    dueDate: data.dueDate,
    onedriveUrl: data.onedriveUrl,
    targetType: data.targetType,
    createdBy: adminUserId,
    groupIds: data.groupIds || []
  });

  return await assignmentRepo.findById(assignment.id);
}

async function updateAssignment(assignmentId, data) {
  const existing = await assignmentRepo.findById(assignmentId);
  if (!existing) {
    const error = new Error('Assignment not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await assignmentRepo.updateAssignment(assignmentId, data);
  return await assignmentRepo.findById(updated.id);
}

async function listAssignmentsForUser(user) {
  if (user.role === 'ADMIN') {
    return await assignmentRepo.findAllAssignmentsForAdmin();
  }

  // Student flow:
  const activeGroup = await groupRepo.findUserActiveGroup(user.id);
  const groupId = activeGroup ? activeGroup.id : null;

  const assignments = await assignmentRepo.findAssignmentsForStudent(user.id, groupId);

  // For each assignment, also attach group progress if student is in a group
  const results = [];
  for (const a of assignments) {
    let groupProgress = null;
    if (groupId) {
      groupProgress = await submissionRepo.getGroupProgressForAssignment(groupId, a.id);
    }

    results.push({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.due_date,
      onedriveUrl: a.onedrive_url,
      targetType: a.target_type,
      targetGroups: a.target_groups,
      createdAt: a.created_at,
      mySubmission: {
        status: a.submission_status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
        confirmedAt: a.confirmed_at
      },
      groupProgress: groupProgress
        ? {
            eligibleCount: groupProgress.eligibleCount,
            confirmedCount: groupProgress.confirmedCount,
            pendingCount: groupProgress.pendingCount,
            percentage: groupProgress.percentage
          }
        : null
    });
  }

  return results;
}

async function getAssignmentById(assignmentId, user) {
  const assignment = await assignmentRepo.findById(assignmentId);
  if (!assignment) {
    const error = new Error('Assignment not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN') {
    return assignment;
  }

  // Verify student eligibility
  const activeGroup = await groupRepo.findUserActiveGroup(user.id);
  const groupId = activeGroup ? activeGroup.id : null;

  const isEligible = await assignmentRepo.isStudentEligible(assignmentId, user.id, groupId);
  if (!isEligible) {
    const error = new Error('Forbidden: You are not eligible for this assignment');
    error.statusCode = 403;
    throw error;
  }

  // Fetch student's own submission status
  const submission = await submissionRepo.findByStudentAndAssignment(user.id, assignmentId);

  // Group progress
  let groupProgress = null;
  if (groupId) {
    groupProgress = await submissionRepo.getGroupProgressForAssignment(groupId, assignmentId);
  }

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.due_date,
    onedriveUrl: assignment.onedrive_url,
    targetType: assignment.target_type,
    targetGroups: assignment.target_groups,
    creatorName: assignment.creator_name,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,
    mySubmission: {
      status: submission ? 'CONFIRMED' : 'PENDING',
      confirmedAt: submission ? submission.confirmed_at : null
    },
    groupProgress: groupProgress
      ? {
          eligibleCount: groupProgress.eligibleCount,
          confirmedCount: groupProgress.confirmedCount,
          pendingCount: groupProgress.pendingCount,
          percentage: groupProgress.percentage,
          members: groupProgress.members
        }
      : null
  };
}

module.exports = {
  createAssignment,
  updateAssignment,
  listAssignmentsForUser,
  getAssignmentById
};
