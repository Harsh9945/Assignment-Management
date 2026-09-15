const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');

describe('Critical Acceptance Test (SRS Section 13.2)', () => {
  let adminToken;
  let adminId;

  let s1Token, s1Id;
  let s2Token, s2Id;
  let s3Token, s3Id;
  let s4Token, s4Id;

  let groupId;
  let assignmentId;

  beforeAll(async () => {
    // 1. Ensure database schema is applied
    await waitAndMigrate();

    // 2. Clean test data
    await pool.query(
      'TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, users CASCADE'
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Step 1: Register 1 Admin and 4 Students', async () => {
    // Direct register 4 students
    const s1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student One',
        email: 's1@acceptance.test',
        studentId: 'ACC-001',
        password: 'password123'
      });
    expect(s1Res.status).toBe(201);
    s1Token = s1Res.body.token;
    s1Id = s1Res.body.user.id;

    const s2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Two',
        email: 's2@acceptance.test',
        studentId: 'ACC-002',
        password: 'password123'
      });
    expect(s2Res.status).toBe(201);
    s2Token = s2Res.body.token;
    s2Id = s2Res.body.user.id;

    const s3Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Three',
        email: 's3@acceptance.test',
        studentId: 'ACC-003',
        password: 'password123'
      });
    expect(s3Res.status).toBe(201);
    s3Token = s3Res.body.token;
    s3Id = s3Res.body.user.id;

    const s4Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Four',
        email: 's4@acceptance.test',
        studentId: 'ACC-004',
        password: 'password123'
      });
    expect(s4Res.status).toBe(201);
    s4Token = s4Res.body.token;
    s4Id = s4Res.body.user.id;

    // Create Admin directly in database with ADMIN role
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('adminpassword', 10);
    const adminDb = await pool.query(
      `INSERT INTO users (name, email, student_id, password_hash, role)
       VALUES ('Admin Instructor', 'admin@acceptance.test', NULL, $1, 'ADMIN')
       RETURNING id`,
      [hash]
    );
    adminId = adminDb.rows[0].id;

    // Login as Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@acceptance.test',
        password: 'adminpassword'
      });
    expect(adminLoginRes.status).toBe(200);
    expect(adminLoginRes.body.user.role).toBe('ADMIN');
    adminToken = adminLoginRes.body.token;
  });

  test('Step 2: Student 1 creates a group and adds Students 2, 3, and 4', async () => {
    // S1 creates group
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ name: 'Acceptance Group Alpha' });

    expect(groupRes.status).toBe(201);
    groupId = groupRes.body.group.id;
    expect(groupRes.body.group.members.length).toBe(1); // S1 is creator & member

    // S1 adds S2
    const addS2 = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ studentIdentifier: 's2@acceptance.test' });
    expect(addS2.status).toBe(201);

    // S1 adds S3
    const addS3 = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ studentIdentifier: 'ACC-003' }); // Search by student ID
    expect(addS3.status).toBe(201);

    // S1 adds S4
    const addS4 = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ studentIdentifier: 's4@acceptance.test' });
    expect(addS4.status).toBe(201);

    // Verify all 4 students are in group
    const myGroupRes = await request(app)
      .get('/api/groups/me')
      .set('Authorization', `Bearer ${s1Token}`);
    expect(myGroupRes.status).toBe(200);
    expect(myGroupRes.body.group.members.length).toBe(4);
  });

  test('Step 3: Admin creates assignment targeted to Acceptance Group Alpha', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const assignRes = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Project Phase 1 Submission',
        description: 'Upload your deliverables to the project OneDrive folder.',
        dueDate: futureDate.toISOString(),
        onedriveUrl: 'https://onedrive.live.com/test-submission-folder',
        targetType: 'SPECIFIC_GROUPS',
        groupIds: [groupId]
      });

    expect(assignRes.status).toBe(201);
    assignmentId = assignRes.body.assignment.id;
    expect(assignmentId).toBeDefined();
  });

  test('Step 4: Confirm submission for 3 of the 4 students (S1, S2, S3)', async () => {
    // S1 confirms
    const s1Confirm = await request(app)
      .post(`/api/assignments/${assignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ confirm: true });
    expect(s1Confirm.status).toBe(200);
    expect(s1Confirm.body.submission.status).toBe('CONFIRMED');

    // S2 confirms
    const s2Confirm = await request(app)
      .post(`/api/assignments/${assignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${s2Token}`)
      .send({ confirm: true });
    expect(s2Confirm.status).toBe(200);
    expect(s2Confirm.body.submission.status).toBe('CONFIRMED');

    // S3 confirms
    const s3Confirm = await request(app)
      .post(`/api/assignments/${assignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${s3Token}`)
      .send({ confirm: true });
    expect(s3Confirm.status).toBe(200);
    expect(s3Confirm.body.submission.status).toBe('CONFIRMED');

    // Note: S4 does NOT submit
  });

  test('Step 5: Verify Professor Dashboard shows 3/4 = 75% for that group', async () => {
    const adminProgressRes = await request(app)
      .get(`/api/admin/assignments/${assignmentId}/progress`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminProgressRes.status).toBe(200);
    const data = adminProgressRes.body;

    // Check overall summary
    expect(data.summary.totalEligible).toBe(4);
    expect(data.summary.totalConfirmed).toBe(3);
    expect(data.summary.totalPending).toBe(1);
    expect(data.summary.percentage).toBe(75);

    // Check group breakdown
    const groupData = data.groupBreakdown.find((g) => g.groupId === groupId);
    expect(groupData).toBeDefined();
    expect(groupData.eligibleCount).toBe(4);
    expect(groupData.confirmedCount).toBe(3);
    expect(groupData.pendingCount).toBe(1);
    expect(groupData.percentage).toBe(75);
  });

  test('Step 6: Verify confirmed students (S1, S2, S3) see 75% group figure and CONFIRMED status', async () => {
    for (const token of [s1Token, s2Token, s3Token]) {
      const res = await request(app)
        .get(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.assignment.mySubmission.status).toBe('CONFIRMED');
      expect(res.body.assignment.groupProgress.percentage).toBe(75);
      expect(res.body.assignment.groupProgress.confirmedCount).toBe(3);
      expect(res.body.assignment.groupProgress.eligibleCount).toBe(4);
    }
  });

  test('Step 7: Verify 4th student (S4) sees group at 75% but own status as PENDING', async () => {
    const res = await request(app)
      .get(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${s4Token}`);

    expect(res.status).toBe(200);
    expect(res.body.assignment.mySubmission.status).toBe('PENDING');
    expect(res.body.assignment.groupProgress.percentage).toBe(75);
    expect(res.body.assignment.groupProgress.confirmedCount).toBe(3);
    expect(res.body.assignment.groupProgress.eligibleCount).toBe(4);
  });

  test('Step 8: Verify Idempotency - S1 re-confirms submission without duplicating or altering state', async () => {
    const s1Reconfirm = await request(app)
      .post(`/api/assignments/${assignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ confirm: true });

    expect(s1Reconfirm.status).toBe(200);
    expect(s1Reconfirm.body.submission.status).toBe('CONFIRMED');

    // Check progress is still 75%
    const adminProgressRes = await request(app)
      .get(`/api/admin/assignments/${assignmentId}/progress`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminProgressRes.body.summary.totalConfirmed).toBe(3);
    expect(adminProgressRes.body.summary.percentage).toBe(75);

    // Verify row count in submissions table is still exactly 3
    const dbCount = await pool.query(
      'SELECT COUNT(*)::int AS count FROM submissions WHERE assignment_id = $1',
      [assignmentId]
    );
    expect(dbCount.rows[0].count).toBe(3);
  });

  test('Step 9: Verify Server-Side Role Enforcement - Student cannot access Admin routes (403)', async () => {
    const forbiddenRes = await request(app)
      .get(`/api/admin/assignments/${assignmentId}/progress`)
      .set('Authorization', `Bearer ${s1Token}`);

    expect(forbiddenRes.status).toBe(403);
  });
});
