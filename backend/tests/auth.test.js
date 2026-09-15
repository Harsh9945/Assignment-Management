const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { waitAndMigrate } = require('../src/db/migrate');

describe('Authentication & Validation Test Suite (FR-01)', () => {
  beforeAll(async () => {
    await waitAndMigrate();
    await pool.query(
      'TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, users CASCADE'
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Student Registration (FR-01.1, FR-01.2, FR-01.3)', () => {
    test('registers a new student with valid credentials and hashes password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@univ.edu',
          studentId: 'STU-101',
          password: 'securepassword123'
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('jane.doe@univ.edu');
      expect(res.body.user.studentId).toBe('STU-101');
      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.token).toBeDefined();

      // Verify plaintext password is NEVER returned
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.password_hash).toBeUndefined();

      // Verify bcrypt hash is stored in database
      const dbUser = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['jane.doe@univ.edu']);
      expect(dbUser.rows[0].password_hash).toMatch(/^\$2[aby]\$\d+\$/);
      expect(dbUser.rows[0].password_hash).not.toBe('securepassword123');
    });

    test('rejects duplicate email registration with 409 Conflict (FR-01.2)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Duplicate',
          email: 'jane.doe@univ.edu', // Duplicate email
          studentId: 'STU-999',
          password: 'anotherpassword'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('rejects duplicate studentId registration with 409 Conflict (FR-01.2)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Student',
          email: 'another@univ.edu',
          studentId: 'STU-101', // Duplicate student ID
          password: 'anotherpassword'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('validates required fields and invalid formats with 400 (Zod)', async () => {
      // Missing name and invalid email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email-address',
          studentId: '',
          password: '123' // too short (<6)
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication & Token Issuance (FR-01.4, FR-01.5, FR-01.6)', () => {
    test('authenticates successfully using email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'jane.doe@univ.edu',
          password: 'securepassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('jane.doe@univ.edu');
    });

    test('authenticates successfully using student ID', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'STU-101',
          password: 'securepassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.studentId).toBe('STU-101');
    });

    test('rejects invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'jane.doe@univ.edu',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid.*password/i);
    });

    test('rejects non-existent user with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nobody@univ.edu',
          password: 'somepassword'
        });

      expect(res.status).toBe(401);
    });

    test('rejects protected route when Authorization header is missing (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('rejects protected route when token is malformed (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer gibberish.token.here');
      expect(res.status).toBe(401);
    });
  });
});
