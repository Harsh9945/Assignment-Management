const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedV3() {
  const client = await pool.connect();
  try {
    console.log('[Seed v3] Starting database seeding for Task 2...');
    await client.query('BEGIN');

    // Clean existing data
    await client.query('TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, course_enrollments, courses, users CASCADE');

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const studentPasswordHash = await bcrypt.hash('student123', 10);

    // 1. Create Admin / Professor
    const adminRes = await client.query(
      `INSERT INTO users (name, email, student_id, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Prof. Rajesh Sharma', 'prof.sharma@eduflow.edu', null, adminPasswordHash, 'ADMIN']
    );
    const adminId = adminRes.rows[0].id;

    // 2. Create 4 Students
    const studentsData = [
      { name: 'Aarav Sharma', email: 'aarav@eduflow.edu', studentId: '2024CS01' },
      { name: 'Priya Patel', email: 'priya@eduflow.edu', studentId: '2024CS02' },
      { name: 'Rohan Verma', email: 'rohan@eduflow.edu', studentId: '2024CS03' },
      { name: 'Ananya Iyer', email: 'ananya@eduflow.edu', studentId: '2024CS04' }
    ];

    const studentIds = [];
    for (const s of studentsData) {
      const res = await client.query(
        `INSERT INTO users (name, email, student_id, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [s.name, s.email, s.studentId, studentPasswordHash, 'STUDENT']
      );
      studentIds.push(res.rows[0].id);
    }

    // 3. Create Courses
    const course1Res = await client.query(
      `INSERT INTO courses (name, code, description, professor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        'Introduction to Computer Science',
        'CS101',
        'Foundational algorithms, data structures, and backend software engineering principles.',
        adminId
      ]
    );
    const course1Id = course1Res.rows[0].id;

    const course2Res = await client.query(
      `INSERT INTO courses (name, code, description, professor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        'Software Engineering & Systems',
        'SE302',
        'Advanced system design, distributed architectures, databases, and group collaboration.',
        adminId
      ]
    );
    const course2Id = course2Res.rows[0].id;

    // 4. Enroll Students in Courses
    // All 4 students in CS101
    for (const sId of studentIds) {
      await client.query(
        `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)`,
        [course1Id, sId]
      );
    }
    // Students 1, 2, 3 in SE302
    for (let i = 0; i < 3; i++) {
      await client.query(
        `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)`,
        [course2Id, studentIds[i]]
      );
    }

    // 5. Create Group "Alpha Squad" with Aarav (Student 1) as owner/leader
    const groupRes = await client.query(
      `INSERT INTO groups (name, owner_id)
       VALUES ($1, $2)
       RETURNING id`,
      ['Alpha Squad', studentIds[0]]
    );
    const groupId = groupRes.rows[0].id;

    // Add all 4 students to Alpha Squad
    for (const sId of studentIds) {
      await client.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
        [groupId, sId]
      );
    }

    // 6. Create Assignments
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const demoOneDriveUrl = process.env.DEMO_ONEDRIVE_URL || 'https://1drv.ms/f/c/7d64020dedd5564b/IgB9CyqoBLiUS7H5VlvImPiBAcZQBf5_m-h6tRqQgeOqf28?e=V3lbrg';

    // Assignment 1 (CS101, GROUP)
    const assign1Res = await client.query(
      `INSERT INTO assignments (course_id, title, description, due_date, onedrive_url, submission_type, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        course1Id,
        'Final Capstone Project',
        'Please submit your final project artifacts and architecture documentation to the designated OneDrive folder. Only the group leader should confirm submission.',
        futureDate.toISOString(),
        demoOneDriveUrl,
        'GROUP',
        'SPECIFIC_GROUPS',
        adminId
      ]
    );
    const assign1Id = assign1Res.rows[0].id;

    await client.query(
      `INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)`,
      [assign1Id, groupId]
    );

    // Assignment 2 (CS101, INDIVIDUAL)
    const assign2Res = await client.query(
      `INSERT INTO assignments (course_id, title, description, due_date, onedrive_url, submission_type, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        course1Id,
        'Individual Lab Report 1',
        'Upload your individual analysis report regarding time complexity and algorithm benchmarks.',
        futureDate.toISOString(),
        demoOneDriveUrl,
        'INDIVIDUAL',
        'ALL_STUDENTS',
        adminId
      ]
    );
    const assign2Id = assign2Res.rows[0].id;

    // Seed 1 submission for Assignment 2 (Priya Patel submitted, Aarav Sharma pending for live demo submission)
    await client.query(
      `INSERT INTO submissions (assignment_id, student_id, confirmed_by, status)
       VALUES ($1, $2, $3, 'CONFIRMED')`,
      [assign2Id, studentIds[1], studentIds[1]]
    );

    // Assignment 3 (SE302, GROUP)
    await client.query(
      `INSERT INTO assignments (course_id, title, description, due_date, onedrive_url, submission_type, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        course2Id,
        'System Architecture Review',
        'Submit system architecture specifications and diagrams. Group leader must confirm submission.',
        pastDate.toISOString(),
        demoOneDriveUrl,
        'GROUP',
        'ALL_STUDENTS',
        adminId
      ]
    );

    await client.query('COMMIT');
    console.log('[Seed v3] Database seeded successfully!');
    console.log('[Seed v3] Admin: prof.sharma@eduflow.edu / admin123');
    console.log('[Seed v3] Students: aarav@eduflow.edu (Leader), priya@eduflow.edu, rohan@eduflow.edu, ananya@eduflow.edu / student123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed v3] Error seeding database:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedV3()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedV3 };
