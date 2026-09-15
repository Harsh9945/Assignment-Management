const { query } = require('../config/db');

async function upsertSubmission({ assignmentId, studentId, groupId }) {
  const res = await query(
    `INSERT INTO submissions (assignment_id, student_id, group_id, status, confirmed_at)
     VALUES ($1, $2, $3, 'CONFIRMED', NOW())
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET status = 'CONFIRMED'
     RETURNING id, assignment_id, student_id, group_id, status, confirmed_at`,
    [assignmentId, studentId, groupId || null]
  );
  return res.rows[0];
}

async function findByStudentAndAssignment(studentId, assignmentId) {
  const res = await query(
    `SELECT id, assignment_id, student_id, group_id, status, confirmed_at
     FROM submissions
     WHERE student_id = $1 AND assignment_id = $2`,
    [studentId, assignmentId]
  );
  return res.rows[0] || null;
}

async function getGroupProgressForAssignment(groupId, assignmentId) {
  // E = active members in group
  // C = members with confirmed submission for this assignment
  const res = await query(
    `SELECT
       u.id AS student_id,
       u.name,
       u.email,
       u.student_id AS student_code,
       s.status,
       s.confirmed_at
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     LEFT JOIN submissions s ON s.assignment_id = $2 AND s.student_id = u.id
     WHERE gm.group_id = $1
     ORDER BY u.name ASC`,
    [groupId, assignmentId]
  );

  const members = res.rows.map((row) => ({
    studentId: row.student_id,
    name: row.name,
    email: row.email,
    studentCode: row.student_code,
    status: row.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
    confirmedAt: row.confirmed_at
  }));

  const eligibleCount = members.length;
  const confirmedCount = members.filter((m) => m.status === 'CONFIRMED').length;
  const pendingCount = eligibleCount - confirmedCount;
  const percentage = eligibleCount > 0 ? Math.round((confirmedCount / eligibleCount) * 100) : null;

  return {
    groupId,
    assignmentId,
    eligibleCount,
    confirmedCount,
    pendingCount,
    percentage,
    members
  };
}

async function getAssignmentProgressForAdmin(assignmentId) {
  // First, get assignment details & target groups
  const assignRes = await query(
    `SELECT a.id, a.title, a.target_type FROM assignments a WHERE a.id = $1`,
    [assignmentId]
  );
  if (assignRes.rowCount === 0) return null;

  const assignment = assignRes.rows[0];

  let eligibleStudentsQuery;
  let params = [];

  if (assignment.target_type === 'ALL_STUDENTS') {
    eligibleStudentsQuery = `
      SELECT u.id AS student_id, u.name, u.email, u.student_id AS student_code,
             g.id AS group_id, g.name AS group_name,
             s.status, s.confirmed_at
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.user_id
      LEFT JOIN groups g ON gm.group_id = g.id
      LEFT JOIN submissions s ON s.assignment_id = $1 AND s.student_id = u.id
      WHERE u.role = 'STUDENT'
      ORDER BY g.name NULLS LAST, u.name ASC
    `;
    params = [assignmentId];
  } else {
    eligibleStudentsQuery = `
      SELECT u.id AS student_id, u.name, u.email, u.student_id AS student_code,
             g.id AS group_id, g.name AS group_name,
             s.status, s.confirmed_at
      FROM assignment_groups ag
      JOIN groups g ON ag.group_id = g.id
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN submissions s ON s.assignment_id = $1 AND s.student_id = u.id
      WHERE ag.assignment_id = $1 AND u.role = 'STUDENT'
      ORDER BY g.name ASC, u.name ASC
    `;
    params = [assignmentId];
  }

  const res = await query(eligibleStudentsQuery, params);
  const rows = res.rows;

  const totalEligible = rows.length;
  const confirmedRows = rows.filter((r) => r.status === 'CONFIRMED');
  const totalConfirmed = confirmedRows.length;
  const totalPending = totalEligible - totalConfirmed;
  const overallPercentage = totalEligible > 0 ? Math.round((totalConfirmed / totalEligible) * 100) : 0;

  // Group-wise breakdown
  const groupsMap = new Map();

  for (const r of rows) {
    const gKey = r.group_id || 'unassigned';
    const gName = r.group_name || 'Individual / Unassigned';

    if (!groupsMap.has(gKey)) {
      groupsMap.set(gKey, {
        groupId: r.group_id,
        groupName: gName,
        eligibleCount: 0,
        confirmedCount: 0,
        pendingCount: 0,
        percentage: 0,
        students: []
      });
    }

    const gData = groupsMap.get(gKey);
    gData.eligibleCount += 1;
    const isConfirmed = r.status === 'CONFIRMED';
    if (isConfirmed) gData.confirmedCount += 1;
    else gData.pendingCount += 1;

    gData.students.push({
      studentId: r.student_id,
      name: r.name,
      email: r.email,
      studentCode: r.student_code,
      status: isConfirmed ? 'CONFIRMED' : 'PENDING',
      confirmedAt: r.confirmed_at
    });
  }

  const groupBreakdown = Array.from(groupsMap.values()).map((g) => ({
    ...g,
    percentage: g.eligibleCount > 0 ? Math.round((g.confirmedCount / g.eligibleCount) * 100) : 0
  }));

  return {
    assignmentId,
    title: assignment.title,
    targetType: assignment.target_type,
    summary: {
      totalEligible,
      totalConfirmed,
      totalPending,
      percentage: overallPercentage
    },
    groupBreakdown,
    students: rows.map((r) => ({
      studentId: r.student_id,
      name: r.name,
      email: r.email,
      studentCode: r.student_code,
      groupName: r.group_name || 'Unassigned',
      status: r.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
      confirmedAt: r.confirmed_at
    }))
  };
}

async function countConfirmedSubmissions() {
  const res = await query("SELECT COUNT(*)::int AS count FROM submissions WHERE status = 'CONFIRMED'");
  return res.rows[0].count;
}

module.exports = {
  upsertSubmission,
  findByStudentAndAssignment,
  getGroupProgressForAssignment,
  getAssignmentProgressForAdmin,
  countConfirmedSubmissions
};
