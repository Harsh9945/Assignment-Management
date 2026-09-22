const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');

describe('Task 2 End-to-End Acceptance Test Suite (v3.0)', () => {
  let adminToken;
  let leaderToken;
  let memberTokens = [];
  let courseId;
  let assignmentId;

  beforeAll(async () => {
    await waitAndMigrate();
    await pool.query('TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, course_enrollments, courses, users CASCADE');

    // 1. Admin setup
    await request(app).post('/api/auth/register').send({
      name: 'Prof. Final Acceptance',
      email: 'prof.final@eduflow.edu',
      studentId: 'PROF-ACC',
      password: 'password123'
    });
    await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'prof.final@eduflow.edu'");
    const adminLogin = await request(app).post('/api/auth/login').send({
      identifier: 'prof.final@eduflow.edu',
      password: 'password123'
    });
    adminToken = adminLogin.body.token;

    // 2. Register 4 Students
    const studentEmails = ['s1@eduflow.edu', 's2@eduflow.edu', 's3@eduflow.edu', 's4@eduflow.edu'];
    for (let i = 0; i < studentEmails.length; i++) {
      const reg = await request(app).post('/api/auth/register').send({
        name: `Acc Student ${i + 1}`,
        email: studentEmails[i],
        studentId: `STU-ACC-0${i + 1}`,
        password: 'password123'
      });
      if (i === 0) {
        leaderToken = reg.body.token;
      } else {
        memberTokens.push(reg.body.token);
      }
    }

    // 3. Admin creates Course CS500
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Distributed Cloud Systems',
        code: 'CS500',
        description: 'Capstones and distributed databases'
      });
    courseId = courseRes.body.course.id;

    // 4. Enroll all 4 students in CS500
    for (const email of studentEmails) {
      await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentIdentifier: email });
    }

    // 5. Leader creates Group "Cloud Titans" and adds remaining 3 members
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ name: 'Cloud Titans' });
    const groupId = groupRes.body.group.id;

    for (let i = 1; i < studentEmails.length; i++) {
      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({ studentIdentifier: studentEmails[i] });
    }

    // 6. Admin creates GROUP assignment in CS500
    const assignRes = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courseId,
        title: 'Cloud Capstone Submission',
        description: 'Final submission for Cloud Titans.',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        onedriveUrl: 'https://1drv.ms/capstone',
        submissionType: 'GROUP',
        targetType: 'ALL_STUDENTS'
      });
    assignmentId = assignRes.body.assignment.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Verify single-click leader confirmation updates all 4 students and course analytics to 100%', async () => {
    // 1. Check initial state: 0% completion
    let analytics = await request(app)
      .get(`/api/courses/${courseId}/analytics`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(analytics.body.analytics.completionPercentage).toBe(0);

    // 2. Leader confirms submission
    const confirmRes = await request(app)
      .post(`/api/assignments/${assignmentId}/confirm-submission`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ confirm: true });

    expect(confirmRes.status).toBe(200);

    // 3. Verify all 4 member tokens show CONFIRMED status
    for (const mToken of memberTokens) {
      const subRes = await request(app)
        .get(`/api/assignments/${assignmentId}/my-submission`)
        .set('Authorization', `Bearer ${mToken}`);
      expect(subRes.body.status).toBe('CONFIRMED');
    }

    // 4. Verify Course Analytics now reflects 100% completion
    analytics = await request(app)
      .get(`/api/courses/${courseId}/analytics`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(analytics.body.analytics.completionPercentage).toBe(100);
  });
});
