const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function waitAndMigrate(retries = 15, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[Migration] Connecting to PostgreSQL (Attempt ${i}/${retries})...`);
      const client = await pool.connect();
      try {
        console.log('[Migration] Database connected successfully. Running schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);

        const migrationsDir = path.join(__dirname, 'migrations');
        if (fs.existsSync(migrationsDir)) {
          const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
          for (const file of files) {
            console.log(`[Migration] Running migration ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(sql);
          }
        }

        console.log('[Migration] Schema migration completed successfully.');
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn(`[Migration] Attempt ${i} failed: ${err.message}`);
      if (i === retries) {
        console.error('[Migration] All retry attempts exhausted. Exiting with failure.');
        throw err;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

if (require.main === module) {
  waitAndMigrate()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}

module.exports = { waitAndMigrate };
