const { pool } = require('../config/db');

async function createCourse({ name, code, description, professorId }) {
  const query = `
    INSERT INTO courses (name, code, description, professor_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, code, description, professor_id AS "professorId", created_at AS "createdAt"
  `;
  const res = await pool.query(query, [name, code, description || null, professorId]);
  return res.rows[0];
}

async function findCourseById(id) {
  const query = `
    SELECT c.id, c.name, c.code, c.description, c.professor_id AS "professorId", c.created_at AS "createdAt",
           u.name AS "professorName", u.email AS "professorEmail"
    FROM courses c
    JOIN users u ON c.professor_id = u.id
    WHERE c.id = $1
  `;
  const res = await pool.query(query, [id]);
  return res.rows[0] || null;
}

async function findCourseByCode(code) {
  const query = `SELECT id FROM courses WHERE LOWER(code) = LOWER($1)`;
  const res = await pool.query(query, [code]);
  return res.rows[0] || null;
}

async function getCoursesByProfessorId(professorId) {
  const query = `
    SELECT c.id, c.name, c.code, c.description, c.created_at AS "createdAt",
           COUNT(DISTINCT ce.student_id)::int AS "studentCount",
           COUNT(DISTINCT a.id)::int AS "assignmentCount"
    FROM courses c
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    WHERE c.professor_id = $1
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  const res = await pool.query(query, [professorId]);
  return res.rows;
}

async function getCoursesByStudentId(studentId) {
  const query = `
    SELECT c.id, c.name, c.code, c.description, c.created_at AS "createdAt",
           u.name AS "professorName",
           COUNT(DISTINCT a.id)::int AS "assignmentCount"
    FROM courses c
    JOIN course_enrollments ce ON c.id = ce.course_id
    JOIN users u ON c.professor_id = u.id
    LEFT JOIN assignments a ON c.id = a.course_id
    WHERE ce.student_id = $1
    GROUP BY c.id, u.name
    ORDER BY c.name ASC
  `;
  const res = await pool.query(query, [studentId]);
  return res.rows;
}

async function isStudentEnrolledInCourse(courseId, studentId) {
  const query = `
    SELECT 1 FROM course_enrollments
    WHERE course_id = $1 AND student_id = $2
  `;
  const res = await pool.query(query, [courseId, studentId]);
  return res.rows.length > 0;
}

async function enrollStudentInCourse(courseId, studentId) {
  const query = `
    INSERT INTO course_enrollments (course_id, student_id)
    VALUES ($1, $2)
    ON CONFLICT (course_id, student_id) DO NOTHING
    RETURNING id
  `;
  const res = await pool.query(query, [courseId, studentId]);
  return res.rows[0] || null;
}

async function getCourseAnalytics(courseId) {
  const course = await findCourseById(courseId);
  if (!course) return null;

  const studentsQuery = `
    SELECT u.id, u.name, u.email, u.student_id AS "studentId"
    FROM course_enrollments ce
    JOIN users u ON ce.student_id = u.id
    WHERE ce.course_id = $1
    ORDER BY u.name ASC
  `;
  const studentsRes = await pool.query(studentsQuery, [courseId]);

  const assignmentsQuery = `
    SELECT a.id, a.title, a.due_date AS "dueDate", a.submission_type AS "submissionType",
           COUNT(s.id)::int AS "confirmedSubmissions"
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.status = 'CONFIRMED'
    WHERE a.course_id = $1
    GROUP BY a.id
    ORDER BY a.due_date ASC
  `;
  const assignmentsRes = await pool.query(assignmentsQuery, [courseId]);

  const totalStudents = studentsRes.rows.length;
  const totalAssignments = assignmentsRes.rows.length;
  const expectedSubmissions = totalStudents * totalAssignments;

  let totalConfirmed = 0;
  assignmentsRes.rows.forEach((a) => {
    totalConfirmed += a.confirmedSubmissions;
  });

  const completionPercentage = expectedSubmissions > 0
    ? Math.round((totalConfirmed / expectedSubmissions) * 100)
    : 0;

  return {
    course,
    totalStudents,
    totalAssignments,
    completionPercentage,
    students: studentsRes.rows,
    assignments: assignmentsRes.rows
  };
}

async function getAllCourses() {
  const query = `
    SELECT c.id, c.name, c.code, c.description, c.created_at AS "createdAt",
           u.name AS "professorName",
           COUNT(DISTINCT ce.student_id)::int AS "studentCount"
    FROM courses c
    JOIN users u ON c.professor_id = u.id
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id
    GROUP BY c.id, u.name
    ORDER BY c.created_at DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

module.exports = {
  createCourse,
  findCourseById,
  findCourseByCode,
  getCoursesByProfessorId,
  getCoursesByStudentId,
  isStudentEnrolledInCourse,
  enrollStudentInCourse,
  getCourseAnalytics,
  getAllCourses
};
