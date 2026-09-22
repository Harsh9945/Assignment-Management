const { query, getClient } = require('../config/db');

async function createAssignment({ courseId, title, description, dueDate, onedriveUrl, submissionType = 'INDIVIDUAL', targetType = 'ALL_STUDENTS', createdBy, groupIds = [] }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `INSERT INTO assignments (course_id, title, description, due_date, onedrive_url, submission_type, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, course_id AS "courseId", title, description, due_date AS "dueDate", onedrive_url AS "onedriveUrl", submission_type AS "submissionType", target_type AS "targetType", created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [courseId || null, title, description, dueDate, onedriveUrl, submissionType, targetType, createdBy]
    );
    const assignment = res.rows[0];

    if (targetType === 'SPECIFIC_GROUPS' && Array.isArray(groupIds) && groupIds.length > 0) {
      for (const gid of groupIds) {
        await client.query(
          `INSERT INTO assignment_groups (assignment_id, group_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [assignment.id, gid]
        );
      }
    }

    await client.query('COMMIT');
    return assignment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateAssignment(id, { courseId, title, description, dueDate, onedriveUrl, submissionType, targetType, groupIds }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const fields = [];
    const params = [];
    let idx = 1;

    if (courseId !== undefined) {
      fields.push(`course_id = $${idx++}`);
      params.push(courseId || null);
    }
    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      params.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      params.push(description);
    }
    if (dueDate !== undefined) {
      fields.push(`due_date = $${idx++}`);
      params.push(dueDate);
    }
    if (onedriveUrl !== undefined) {
      fields.push(`onedrive_url = $${idx++}`);
      params.push(onedriveUrl);
    }
    if (submissionType !== undefined) {
      fields.push(`submission_type = $${idx++}`);
      params.push(submissionType);
    }
    if (targetType !== undefined) {
      fields.push(`target_type = $${idx++}`);
      params.push(targetType);
    }

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const updateSql = `
      UPDATE assignments
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await client.query(updateSql, params);
    const updated = res.rows[0];

    if (!updated) {
      await client.query('ROLLBACK');
      return null;
    }

    if (groupIds !== undefined) {
      await client.query('DELETE FROM assignment_groups WHERE assignment_id = $1', [id]);
      if (targetType === 'SPECIFIC_GROUPS' || (targetType === undefined && updated.target_type === 'SPECIFIC_GROUPS')) {
        for (const gid of groupIds) {
          await client.query(
            `INSERT INTO assignment_groups (assignment_id, group_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [id, gid]
          );
        }
      }
    }

    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findById(id) {
  const res = await query(
    `SELECT a.id, a.course_id, a.title, a.description, a.due_date, a.onedrive_url,
            a.submission_type, a.target_type, a.created_by, a.created_at, a.updated_at,
            u.name AS creator_name,
            c.name AS course_name, c.code AS course_code,
            COALESCE(
              json_agg(
                json_build_object('id', g.id, 'name', g.name)
              ) FILTER (WHERE g.id IS NOT NULL),
              '[]'
            ) AS target_groups
     FROM assignments a
     JOIN users u ON a.created_by = u.id
     LEFT JOIN courses c ON a.course_id = c.id
     LEFT JOIN assignment_groups ag ON a.id = ag.assignment_id
     LEFT JOIN groups g ON ag.group_id = g.id
     WHERE a.id = $1
     GROUP BY a.id, u.name, c.name, c.code`,
    [id]
  );
  return res.rows[0] || null;
}

async function findAssignmentsForStudent(studentId, userGroupId = null) {
  let sql = `
    SELECT a.id, a.course_id, a.title, a.description, a.due_date, a.onedrive_url,
           a.submission_type, a.target_type, a.created_at,
           c.name AS course_name, c.code AS course_code,
           s.status AS submission_status, s.confirmed_at,
           COALESCE(
             json_agg(
               json_build_object('id', g.id, 'name', g.name)
             ) FILTER (WHERE g.id IS NOT NULL),
             '[]'
           ) AS target_groups
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN assignment_groups ag ON a.id = ag.assignment_id
    LEFT JOIN groups g ON ag.group_id = g.id
    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
    WHERE a.target_type = 'ALL_STUDENTS'
  `;

  const params = [studentId];

  if (userGroupId) {
    sql += ` OR (a.target_type = 'SPECIFIC_GROUPS' AND a.id IN (
      SELECT assignment_id FROM assignment_groups WHERE group_id = $2
    ))`;
    params.push(userGroupId);
  }

  sql += `
    GROUP BY a.id, c.name, c.code, s.status, s.confirmed_at
    ORDER BY a.due_date ASC
  `;

  const res = await query(sql, params);
  return res.rows;
}

async function getAssignmentsByCourseId(courseId) {
  const res = await query(
    `SELECT a.id, a.course_id, a.title, a.description, a.due_date, a.onedrive_url,
            a.submission_type, a.target_type, a.created_at, a.updated_at,
            (SELECT COUNT(*)::int FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'CONFIRMED') AS confirmed_count
     FROM assignments a
     WHERE a.course_id = $1
     ORDER BY a.due_date ASC`,
    [courseId]
  );
  return res.rows;
}

async function getAssignmentsForStudentInCourse(courseId, studentId) {
  const res = await query(
    `SELECT a.id, a.course_id, a.title, a.description, a.due_date, a.onedrive_url,
            a.submission_type, a.target_type, a.created_at,
            s.status AS submission_status, s.confirmed_at, s.confirmed_by
     FROM assignments a
     LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $2
     WHERE a.course_id = $1
     ORDER BY a.due_date ASC`,
    [courseId, studentId]
  );
  return res.rows;
}

async function findAllAssignmentsForAdmin() {
  const res = await query(
    `SELECT a.id, a.course_id, a.title, a.description, a.due_date, a.onedrive_url,
            a.submission_type, a.target_type, a.created_at, a.updated_at,
            u.name AS creator_name,
            c.name AS course_name, c.code AS course_code,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object('id', g.id, 'name', g.name)
              ) FILTER (WHERE g.id IS NOT NULL),
              '[]'
            ) AS target_groups,
            (SELECT COUNT(*)::int FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'CONFIRMED') AS confirmed_count
     FROM assignments a
     JOIN users u ON a.created_by = u.id
     LEFT JOIN courses c ON a.course_id = c.id
     LEFT JOIN assignment_groups ag ON a.id = ag.assignment_id
     LEFT JOIN groups g ON ag.group_id = g.id
     GROUP BY a.id, u.name, c.name, c.code
     ORDER BY a.created_at DESC`
  );
  return res.rows;
}

async function isStudentEligible(assignmentId, studentId, userGroupId = null) {
  const res = await query(
    `SELECT target_type, course_id FROM assignments WHERE id = $1`,
    [assignmentId]
  );
  if (res.rowCount === 0) return false;

  const { target_type, course_id } = res.rows[0];

  // If assignment is linked to a course, student must be enrolled in that course
  if (course_id) {
    const enrollCheck = await query(
      `SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2`,
      [course_id, studentId]
    );
    if (enrollCheck.rowCount === 0) return false;
  }

  if (target_type === 'ALL_STUDENTS') return true;

  if (target_type === 'SPECIFIC_GROUPS') {
    if (!userGroupId) return false;
    const match = await query(
      `SELECT 1 FROM assignment_groups WHERE assignment_id = $1 AND group_id = $2`,
      [assignmentId, userGroupId]
    );
    return match.rowCount > 0;
  }

  return false;
}

async function countAssignments() {
  const res = await query('SELECT COUNT(*)::int AS count FROM assignments');
  return res.rows[0].count;
}

module.exports = {
  createAssignment,
  updateAssignment,
  findById,
  findAssignmentsForStudent,
  getAssignmentsByCourseId,
  getAssignmentsForStudentInCourse,
  findAllAssignmentsForAdmin,
  isStudentEligible,
  countAssignments
};
