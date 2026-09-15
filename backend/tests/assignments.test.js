const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');
const bcrypt = require('bcryptjs');

describe('Assignment Management, Targeting & Validation (FR-04, FR-05)', () => {
  let adminToken;
  let student1Token, student1Id;
  let student2Token, student2Id;
  let group1Id, group2Id;

  beforeAll(async () => {
    await waitAndMigrate();
    await pool.query(
      'TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, users CASCADE'
    );

    // Create Admin
    const adminHash = await bcrypt.hash('adminpass', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Instructor Xavier', 'xavier@univ.edu', $1, 'ADMIN')`,
      [adminHash]
    );

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'xavier@univ.edu', password: 'adminpass' });
    adminToken = adminLogin.body.token;

    // Create Student 1
    const s1Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student 1', email: 's1@univ.edu', studentId: 'S-1', password: 'password123' });
    student1Token = s1Res.body.token;
    student1Id = s1Res.body.user.id;

    // Create Student 2
    const s2Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student 2', email: 's2@univ.edu', studentId: 'S-2', password: 'password123' });
    student2Token = s2Res.body.token;
    student2Id = s2Res.body.user.id;

    // Student 1 creates Group 1
    const g1Res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ name: 'Team One' });
    group1Id = g1Res.body.group.id;

    // Student 2 creates Group 2
    const g2Res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ name: 'Team Two' });
    group2Id = g2Res.body.group.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Validation Failures (FR-04.4)', () => {
    test('rejects malformed OneDrive URL with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Assignment with Bad URL',
          description: 'Description here',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          onedriveUrl: 'not-a-url', // Malformed URL
          targetType: 'ALL_STUDENTS'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'onedriveUrl')).toBe(true);
    });

    test('rejects malformed due date with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Assignment with Bad Date',
          description: 'Description here',
          dueDate: 'not-a-valid-date-string', // Malformed date
          onedriveUrl: 'https://onedrive.live.com/redir?test=1',
          targetType: 'ALL_STUDENTS'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'dueDate')).toBe(true);
    });

    test('rejects SPECIFIC_GROUPS when groupIds is empty with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Assignment with No Target Groups',
          description: 'Description here',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          onedriveUrl: 'https://onedrive.live.com/redir?test=1',
          targetType: 'SPECIFIC_GROUPS',
          groupIds: [] // Empty groups array
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'groupIds')).toBe(true);
    });
  });

  describe('Authorization & Role Boundary (FR-01.7, FR-04.1)', () => {
    test('rejects student attempting to create an assignment with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: 'Hacked Assignment',
          description: 'Description here',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          onedriveUrl: 'https://onedrive.live.com/redir?test=1',
          targetType: 'ALL_STUDENTS'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/forbidden/i);
    });
  });

  describe('Assignment Targeting & Eligibility Visibility (FR-04.3, FR-05.1)', () => {
    let allStudentsAssignId;
    let group1AssignId;

    test('admin creates assignment targeted to ALL_STUDENTS', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Cohort-Wide Term Paper',
          description: 'General essay for all students',
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          onedriveUrl: 'https://onedrive.live.com/redir?cohort=paper',
          targetType: 'ALL_STUDENTS'
        });

      expect(res.status).toBe(201);
      allStudentsAssignId = res.body.assignment.id;
    });

    test('admin creates assignment targeted to Team One only (SPECIFIC_GROUPS)', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Team One Lab Report',
          description: 'Lab report exclusively for Team One',
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          onedriveUrl: 'https://onedrive.live.com/redir?group=team1',
          targetType: 'SPECIFIC_GROUPS',
          groupIds: [group1Id]
        });

      expect(res.status).toBe(201);
      group1AssignId = res.body.assignment.id;
    });

    test('student 1 (in Team One) sees both assignments', async () => {
      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const ids = res.body.assignments.map((a) => a.id);
      expect(ids).toContain(allStudentsAssignId);
      expect(ids).toContain(group1AssignId);
    });

    test('student 2 (in Team Two) sees only ALL_STUDENTS assignment, NOT Team One assignment', async () => {
      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(200);
      const ids = res.body.assignments.map((a) => a.id);
      expect(ids).toContain(allStudentsAssignId);
      expect(ids).not.toContain(group1AssignId); // Group 1 assignment must NOT be visible to student 2!
    });

    test('student 2 cannot access Team One assignment directly via GET /api/assignments/:id (403)', async () => {
      const res = await request(app)
        .get(`/api/assignments/${group1AssignId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not eligible/i);
    });

    test('FR-06.4: ineligible student 2 cannot confirm submission for Team One assignment (POST returns 403)', async () => {
      const res = await request(app)
        .post(`/api/assignments/${group1AssignId}/confirm-submission`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ confirm: true });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not eligible to submit this assignment/i);
    });

    test('admin edits an existing assignment (FR-04.2)', async () => {
      const res = await request(app)
        .patch(`/api/assignments/${group1AssignId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Team One Lab Report (Revised Title)'
        });

      expect(res.status).toBe(200);
      expect(res.body.assignment.title).toBe('Team One Lab Report (Revised Title)');

      // Verify student 1 sees revised title without duplicating record
      const s1View = await request(app)
        .get(`/api/assignments/${group1AssignId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(s1View.status).toBe(200);
      expect(s1View.body.assignment.title).toBe('Team One Lab Report (Revised Title)');
    });
  });
});
