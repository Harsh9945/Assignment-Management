const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('[Seed] Starting database seeding...');
    await client.query('BEGIN');

    // Clean existing data
    await client.query('TRUNCATE TABLE submissions, assignment_groups, assignments, group_members, groups, users CASCADE');

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const studentPasswordHash = await bcrypt.hash('student123', 10);

    // 1. Create Admin
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

    // 3. Create Group "Alpha Squad" with Aarav (Student 1) as owner
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
        `INSERT INTO group_members (group_id, user_id)
         VALUES ($1, $2)`,
        [groupId, sId]
      );
    }

    // 4. Create Assignment 1: Targeted to Alpha Squad (Future Due Date)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const demoOneDriveUrl = process.env.DEMO_ONEDRIVE_URL || 'https://onedrive.live.com';

    const assign1Res = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_url, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'Final Capstone Project',
        'Please submit your final project artifacts and architecture documentation to the designated OneDrive folder.',
        futureDate.toISOString(),
        demoOneDriveUrl,
        'SPECIFIC_GROUPS',
        adminId
      ]
    );
    const assign1Id = assign1Res.rows[0].id;

    await client.query(
      `INSERT INTO assignment_groups (assignment_id, group_id)
       VALUES ($1, $2)`,
      [assign1Id, groupId]
    );

    // 5. Confirm Submissions for 3 of the 4 students on Assignment 1
    // Student 1, Student 2, Student 3 confirmed; Student 4 is pending -> 3/4 = 75%
    for (let i = 0; i < 3; i++) {
      await client.query(
        `INSERT INTO submissions (assignment_id, student_id, group_id, status)
         VALUES ($1, $2, $3, 'CONFIRMED')`,
        [assign1Id, studentIds[i], groupId]
      );
    }

    // 6. Create Assignment 2: Targeted to ALL_STUDENTS (Past Due Date for FR-05.3 testing)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_url, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'Orientation Essay & Ethics Form',
        'Upload signed academic integrity policy and brief introductory essay.',
        pastDate.toISOString(),
        demoOneDriveUrl,
        'ALL_STUDENTS',
        adminId
      ]
    );

    await client.query('COMMIT');
    console.log('[Seed] Database seeded successfully!');
    console.log('[Seed] Admin: prof.sharma@eduflow.edu / admin123');
    console.log('[Seed] Students: aarav@eduflow.edu to ananya@eduflow.edu / student123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed] Error seeding database:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
