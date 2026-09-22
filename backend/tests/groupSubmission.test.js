const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');

describe('Group Submission Fan-Out Test Suite (Task 2)', () => {
  let adminToken;
  let leaderToken;
  let memberToken;
  let leaderId;
  let memberId;
  let groupId;
  let groupAssignmentId;
  let individualAssignmentId;

  beforeAll(async () => {
    await waitAndMigrate();
    await pool.query('TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, course_enrollments, courses, users CASCADE');

    // 1. Create Admin
    const adminReg = await request(app).post('/api/auth/register').send({
      name: 'Prof. Group Test',
      email: 'prof.grouptest@eduflow.edu',
      studentId: 'PROF-G01',
      password: 'password123'
    });
    await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'prof.grouptest@eduflow.edu'");
    const adminLogin = await request(app).post('/api/auth/login').send({
      identifier: 'prof.grouptest@eduflow.edu',
      password: 'password123'
    });
    adminToken = adminLogin.body.token;

    // 2. Create Leader (Student 1)
    const leaderReg = await request(app).post('/api/auth/register').send({
      name: 'Leader Alice',
      email: 'alice@eduflow.edu',
      studentId: 'STU-L01',
      password: 'password123'
    });
    leaderToken = leaderReg.body.token;
    leaderId = leaderReg.body.user.id;

    // 3. Create Member (Student 2)
    const memberReg = await request(app).post('/api/auth/register').send({
      name: 'Member Bob',
      email: 'bob@eduflow.edu',
      studentId: 'STU-M02',
      password: 'password123'
    });
    memberToken = memberReg.body.token;
    memberId = memberReg.body.user.id;

    // 4. Create Group owned by Leader Alice
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ name: 'Team Victory' });
    groupId = groupRes.body.group.id;

    // Add Bob to Team Victory
    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ studentIdentifier: 'bob@eduflow.edu' });

    // 5. Create Group Assignment
    const assignRes = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Group Architecture Document',
        description: 'Submit system topology.',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        onedriveUrl: 'https://1drv.ms/test',
        submissionType: 'GROUP',
        targetType: 'ALL_STUDENTS'
      });
    groupAssignmentId = assignRes.body.assignment.id;

    // 6. Create Individual Assignment
    const indRes = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Individual Code Quiz',
        description: 'Take individual quiz.',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        onedriveUrl: 'https://1drv.ms/test',
        submissionType: 'INDIVIDUAL',
        targetType: 'ALL_STUDENTS'
      });
    individualAssignmentId = indRes.body.assignment.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Non-leader member Bob cannot confirm a GROUP assignment (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/assignments/${groupAssignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ confirm: true });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the group leader/i);
  });

  test('Group leader Alice confirms GROUP assignment -> Fan-out creates submission rows for ALL members', async () => {
    const res = await request(app)
      .post(`/api/assignments/${groupAssignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ confirm: true });

    expect(res.status).toBe(200);
    expect(res.body.submissions).toBeDefined();
    expect(res.body.submissions.length).toBe(2);

    // Verify DB submission records
    const subs = await pool.query('SELECT * FROM submissions WHERE assignment_id = $1', [groupAssignmentId]);
    expect(subs.rows.length).toBe(2);
    expect(subs.rows.every((r) => r.status === 'CONFIRMED')).toBe(true);
    expect(subs.rows.every((r) => r.confirmed_by === leaderId)).toBe(true);
  });

  test('Non-leader member Bob now sees submission status as CONFIRMED', async () => {
    const res = await request(app)
      .get(`/api/assignments/${groupAssignmentId}/my-submission`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.confirmedBy).toBe('Leader Alice');
  });

  test('Individual assignment allows direct confirmation by member Bob', async () => {
    const res = await request(app)
      .post(`/api/assignments/${individualAssignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ confirm: true });

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe('CONFIRMED');
  });
});
