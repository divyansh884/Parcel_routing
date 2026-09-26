import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../observability/logger';
import { DepartmentModel } from '../models/Department';
import { ParcelFieldModel } from '../models/ParcelField';
import { getOperatorsForType } from '../controllers/fieldController';

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

    const fieldCount = await ParcelFieldModel.countDocuments();
    if (fieldCount === 0) {
      await ParcelFieldModel.insertMany([
        { name: 'weightKg', label: 'Weight (kg)', type: 'number', required: true, operators: getOperatorsForType('number'), active: true },
        { name: 'valueEur', label: 'Value (€)', type: 'number', required: true, operators: getOperatorsForType('number'), active: true },
        { name: 'destinationCountry', label: 'Destination Country', type: 'enum', required: true, values: ['IN', 'US', 'DE', 'UK', 'FR', 'IT', 'ES'], operators: getOperatorsForType('enum'), active: true }
      ]);
      logger.info('Seeded default parcel fields');
    }

  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};
