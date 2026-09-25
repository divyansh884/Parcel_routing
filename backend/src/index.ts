import { app } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './observability/logger';
import { startBatchWorker } from './workers/batchWorker';

const startServer = async () => {
  await connectDB();
  
  // Start background worker
  startBatchWorker();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
