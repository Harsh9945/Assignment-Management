const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');

describe('Course Management Test Suite (Task 2)', () => {
  let adminToken;
  let student1Token;
  let student2Token;
  let student2Id;
  let courseId;

  beforeAll(async () => {
    await waitAndMigrate();
    await pool.query('TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, course_enrollments, courses, users CASCADE');

    // Register Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Prof. Test Admin',
      email: 'prof.testadmin@eduflow.edu',
      studentId: 'PROF-001',
      password: 'adminpassword123'
    });
    // Manually elevate to ADMIN
    await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'prof.testadmin@eduflow.edu'");

    const adminLogin = await request(app).post('/api/auth/login').send({
      identifier: 'prof.testadmin@eduflow.edu',
      password: 'adminpassword123'
    });
    adminToken = adminLogin.body.token;

    // Register Student 1
    const s1Res = await request(app).post('/api/auth/register').send({
      name: 'Student One',
      email: 'student1@eduflow.edu',
      studentId: 'STU-C01',
      password: 'studentpassword123'
    });
    student1Token = s1Res.body.token;

    // Register Student 2
    const s2Res = await request(app).post('/api/auth/register').send({
      name: 'Student Two',
      email: 'student2@eduflow.edu',
      studentId: 'STU-C02',
      password: 'studentpassword123'
    });
    student2Token = s2Res.body.token;
    student2Id = s2Res.body.user.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Admin creates a new course (POST /api/courses)', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Database Architecture',
        code: 'CS401',
        description: 'Relational design and transaction isolation.'
      });

    expect(res.status).toBe(201);
    expect(res.body.course).toBeDefined();
    expect(res.body.course.code).toBe('CS401');
    courseId = res.body.course.id;
  });

  test('Student cannot create a course (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        name: 'Unauthorised Course',
        code: 'CS999'
      });

    expect(res.status).toBe(403);
  });

  test('Admin enrolls Student 1 into Course CS401', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentIdentifier: 'student1@eduflow.edu'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enrolled/i);
  });

  test('Enrolled Student 1 can access course assignments', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}/assignments`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.assignments)).toBe(true);
  });

  test('Unenrolled Student 2 is denied access to course details (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not enrolled/i);
  });
});
