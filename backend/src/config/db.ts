import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../observability/logger';
import { DepartmentModel } from '../models/Department';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    // Seed default departments if none exist
    const count = await DepartmentModel.countDocuments();
    if (count === 0) {
      await DepartmentModel.insertMany([
        { name: 'REGULAR' },
        { name: 'MAIL' },
        { name: 'HEAVY' },
        { name: 'EUROPE' },
        { name: 'INTERNATIONAL' }
      ]);
      logger.info('Seeded default departments');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};
