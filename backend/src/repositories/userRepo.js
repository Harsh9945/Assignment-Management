const { query } = require('../config/db');

async function findByEmail(email) {
  const res = await query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return res.rows[0] || null;
}

async function findByStudentId(studentId) {
  const res = await query(
    'SELECT * FROM users WHERE LOWER(student_id) = LOWER($1)',
    [studentId]
  );
  return res.rows[0] || null;
}

async function findById(id) {
  const res = await query(
    'SELECT id, name, email, student_id, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0] || null;
}

async function createUser({ name, email, studentId, passwordHash, role = 'STUDENT' }) {
  const res = await query(
    `INSERT INTO users (name, email, student_id, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, student_id, role, created_at`,
    [name, email, studentId || null, passwordHash, role]
  );
  return res.rows[0];
}

async function searchStudents(searchTerm, excludeUserId = null) {
  const term = `%${searchTerm.toLowerCase()}%`;
  let sql = `
    SELECT u.id, u.name, u.email, u.student_id,
           (SELECT gm.group_id FROM group_members gm WHERE gm.user_id = u.id LIMIT 1) AS active_group_id
    FROM users u
    WHERE u.role = 'STUDENT'
      AND (LOWER(u.email) LIKE $1 OR LOWER(u.student_id) LIKE $1)
  `;
  const params = [term];

  if (excludeUserId) {
    sql += ' AND u.id != $2';
    params.push(excludeUserId);
  }

  sql += ' ORDER BY u.name ASC LIMIT 20';
  const res = await query(sql, params);
  return res.rows;
}

async function countStudents() {
  const res = await query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'STUDENT'");
  return res.rows[0].count;
}

module.exports = {
  findByEmail,
  findByStudentId,
  findById,
  createUser,
  searchStudents,
  countStudents
};
