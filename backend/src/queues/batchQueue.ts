import { Queue } from 'bullmq';
import { env } from '../config/env';

export const batchQueue = new Queue('batch-routing-queue', {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});
