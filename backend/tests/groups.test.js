const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');

describe('Group Management & Membership Constraints (FR-02, FR-03)', () => {
  let userA, tokenA; // Owner of Group 1
  let userB, tokenB; // Member of Group 1
  let userC, tokenC; // Owner of Group 2
  let userD, tokenD; // Free student (no group)

  let group1Id, group2Id;

  beforeAll(async () => {
    await waitAndMigrate();
    await pool.query(
      'TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, users CASCADE'
    );

    // Register 4 test students
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@test.com',
      studentId: 'STU-A',
      password: 'password123'
    });
    userA = resA.body.user;
    tokenA = resA.body.token;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@test.com',
      studentId: 'STU-B',
      password: 'password123'
    });
    userB = resB.body.user;
    tokenB = resB.body.token;

    const resC = await request(app).post('/api/auth/register').send({
      name: 'User C',
      email: 'userc@test.com',
      studentId: 'STU-C',
      password: 'password123'
    });
    userC = resC.body.user;
    tokenC = resC.body.token;

    const resD = await request(app).post('/api/auth/register').send({
      name: 'User D',
      email: 'userd@test.com',
      studentId: 'STU-D',
      password: 'password123'
    });
    userD = resD.body.user;
    tokenD = resD.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  test('FR-02.1 & FR-02.2: User A creates Group 1 and is recorded as owner and member', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Group Alpha' });

    expect(res.status).toBe(201);
    expect(res.body.group.name).toBe('Group Alpha');
    expect(res.body.group.owner_id).toBe(userA.id);
    expect(res.body.group.members.length).toBe(1);
    expect(res.body.group.members[0].id).toBe(userA.id);
    group1Id = res.body.group.id;
  });

  test('FR-02.3: User A cannot create a second group while in an active group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Group Alpha Second' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already a member of an active group/i);
  });

  test('FR-03.1: Search students finds user by email and student ID', async () => {
    const searchEmail = await request(app)
      .get('/api/students/search?q=userb@test.com')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(searchEmail.status).toBe(200);
    expect(searchEmail.body.students.length).toBe(1);
    expect(searchEmail.body.students[0].student_id).toBe('STU-B');

    const searchId = await request(app)
      .get('/api/students/search?q=STU-C')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(searchId.status).toBe(200);
    expect(searchId.body.students.length).toBe(1);
    expect(searchId.body.students[0].email).toBe('userc@test.com');
  });

  test('FR-03.2: User A (owner) adds User B to Group 1 directly', async () => {
    const res = await request(app)
      .post(`/api/groups/${group1Id}/members`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ studentIdentifier: 'userb@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.group.members.length).toBe(2);
  });

  test('FR-03.3: Cannot add the same student twice to the same group', async () => {
    const res = await request(app)
      .post(`/api/groups/${group1Id}/members`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ studentIdentifier: 'userb@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already a member of this group/i);
  });

  test('FR-02.1 & FR-03.3: User C creates Group 2; User A cannot add User C because C is in another active group', async () => {
    // User C creates Group 2
    const g2Res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ name: 'Group Beta' });
    expect(g2Res.status).toBe(201);
    group2Id = g2Res.body.group.id;

    // User A tries to add User C to Group 1
    const addCRes = await request(app)
      .post(`/api/groups/${group1Id}/members`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ studentIdentifier: 'userc@test.com' });

    expect(addCRes.status).toBe(400);
    expect(addCRes.body.message).toMatch(/already a member of another active group/i);
  });

  test('FR-03.5: Non-owner (User B) cannot add members (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/groups/${group1Id}/members`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ studentIdentifier: 'userd@test.com' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the group owner/i);
  });

  test('FR-03.5: Non-owner (User B) cannot remove members (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/groups/${group1Id}/members/${userA.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the group owner/i);
  });

  test('FR-03.4: Group owner cannot remove themselves (400 Bad Request)', async () => {
    const res = await request(app)
      .delete(`/api/groups/${group1Id}/members/${userA.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/group owner cannot be removed/i);
  });

  test('FR-03.4: Group owner (User A) removes member (User B) successfully', async () => {
    const res = await request(app)
      .delete(`/api/groups/${group1Id}/members/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.members.length).toBe(1);

    // Verify User B account still exists in database
    const userBCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userB.id]);
    expect(userBCheck.rowCount).toBe(1);

    // Now User B can be added or create a new group
    const bNewGroup = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'User B New Team' });
    expect(bNewGroup.status).toBe(201);
  });
});
