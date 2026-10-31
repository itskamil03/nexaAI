const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { startRoiScheduler } = require('./jobs/roiScheduler');

let server;
let cronTask;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Scheduled Background Tasks
    if (config.nodeEnv !== 'test') {
      cronTask = startRoiScheduler();
    }

    // 3. Start HTTP listener
    server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`  NexaChain AI Backend Server Running on Port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  Cron Schedule: ${config.cronSchedule} (${config.cronTimezone})`);
      console.log(`  Health Check: http://localhost:${config.port}/api/health`);
      console.log(`=======================================================`);
    });

    // 4. Graceful Shutdown Handlers
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      if (cronTask) {
        cronTask.stop();
        console.log('[Scheduler] Cron scheduler stopped.');
      }
      if (server) {
        server.close(async () => {
          console.log('[Server] HTTP listener closed.');
          await disconnectDB();
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (err) {
    console.error(`[Server] Boot failure: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
