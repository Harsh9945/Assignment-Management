const app = require('./app');
const env = require('./config/env');
const { waitAndMigrate } = require('./db/migrate');

async function startServer() {
  try {
    // Ensure database is migrated before serving traffic
    await waitAndMigrate();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Joineazy Backend running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
      console.log(`[Server] Health check available at http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = () => {
      console.log('[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] Closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
