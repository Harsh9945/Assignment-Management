const { query, getClient } = require('../config/db');

async function findById(groupId) {
  const res = await query(
    `SELECT g.id, g.name, g.owner_id, g.created_at, u.name AS owner_name, u.email AS owner_email
     FROM groups g
     JOIN users u ON g.owner_id = u.id
     WHERE g.id = $1`,
    [groupId]
  );
  return res.rows[0] || null;
}

async function findUserActiveGroup(userId) {
  const res = await query(
    `SELECT g.id, g.name, g.owner_id, g.created_at, u.name AS owner_name
     FROM group_members gm
     JOIN groups g ON gm.group_id = g.id
     JOIN users u ON g.owner_id = u.id
     WHERE gm.user_id = $1`,
    [userId]
  );
  return res.rows[0] || null;
}

async function createGroup(name, ownerId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const groupRes = await client.query(
      `INSERT INTO groups (name, owner_id)
       VALUES ($1, $2)
       RETURNING id, name, owner_id, created_at`,
      [name, ownerId]
    );
    const newGroup = groupRes.rows[0];

    // Creator is automatically added as a member
    await client.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)`,
      [newGroup.id, ownerId]
    );

    await client.query('COMMIT');
    return newGroup;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getGroupMembers(groupId) {
  const res = await query(
    `SELECT u.id, u.name, u.email, u.student_id, gm.joined_at
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [groupId]
  );
  return res.rows;
}

async function addMember(groupId, userId) {
  const res = await query(
    `INSERT INTO group_members (group_id, user_id)
     VALUES ($1, $2)
     RETURNING id, group_id, user_id, joined_at`,
    [groupId, userId]
  );
  return res.rows[0];
}

async function removeMember(groupId, userId) {
  const res = await query(
    `DELETE FROM group_members
     WHERE group_id = $1 AND user_id = $2
     RETURNING id`,
    [groupId, userId]
  );
  return res.rows[0] || null;
}

async function isMember(groupId, userId) {
  const res = await query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return res.rowCount > 0;
}

async function countGroups() {
  const res = await query('SELECT COUNT(*)::int AS count FROM groups');
  return res.rows[0].count;
}

async function getAllGroups() {
  const res = await query(
    `SELECT g.id, g.name, g.owner_id, g.created_at,
            (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) AS member_count
     FROM groups g
     ORDER BY g.created_at DESC`
  );
  return res.rows;
}

module.exports = {
  findById,
  findUserActiveGroup,
  createGroup,
  getGroupMembers,
  addMember,
  removeMember,
  isMember,
  countGroups,
  getAllGroups
};
