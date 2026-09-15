const userRepo = require('../repositories/userRepo');
const groupRepo = require('../repositories/groupRepo');
const assignmentRepo = require('../repositories/assignmentRepo');
const submissionRepo = require('../repositories/submissionRepo');

async function getGroupProgress(groupId, assignmentId) {
  const group = await groupRepo.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  return await submissionRepo.getGroupProgressForAssignment(groupId, assignmentId);
}

async function getAdminAssignmentProgress(assignmentId) {
  const data = await submissionRepo.getAssignmentProgressForAdmin(assignmentId);
  if (!data) {
    const error = new Error('Assignment not found');
    error.statusCode = 404;
    throw error;
  }
  return data;
}

async function getAdminDashboardSummary() {
  const [totalStudents, totalGroups, totalAssignments, allAssignments] = await Promise.all([
    userRepo.countStudents(),
    groupRepo.countGroups(),
    assignmentRepo.countAssignments(),
    assignmentRepo.findAllAssignmentsForAdmin()
  ]);

  // Aggregate completion across all assignments
  let totalEligibleAcrossAll = 0;
  let totalConfirmedAcrossAll = 0;

  const chartData = [];

  for (const assign of allAssignments) {
    const progress = await submissionRepo.getAssignmentProgressForAdmin(assign.id);
    if (progress && progress.summary) {
      totalEligibleAcrossAll += progress.summary.totalEligible;
      totalConfirmedAcrossAll += progress.summary.totalConfirmed;

      chartData.push({
        assignmentId: assign.id,
        title: assign.title.length > 20 ? assign.title.slice(0, 18) + '...' : assign.title,
        fullTitle: assign.title,
        confirmed: progress.summary.totalConfirmed,
        pending: progress.summary.totalPending,
        totalEligible: progress.summary.totalEligible,
        percentage: progress.summary.percentage
      });
    }
  }

  const overallCompletionPercentage =
    totalEligibleAcrossAll > 0
      ? Math.round((totalConfirmedAcrossAll / totalEligibleAcrossAll) * 100)
      : 0;

  return {
    totals: {
      totalStudents,
      totalGroups,
      totalAssignments,
      totalEligibleSubmissions: totalEligibleAcrossAll,
      totalConfirmedSubmissions: totalConfirmedAcrossAll,
      overallCompletionPercentage
    },
    chartData,
    recentAssignments: allAssignments.slice(0, 5)
  };
}

module.exports = {
  getGroupProgress,
  getAdminAssignmentProgress,
  getAdminDashboardSummary
};
