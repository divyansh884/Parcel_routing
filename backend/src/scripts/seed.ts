import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { RuleSetModel } from '../models/RuleSet';
import { UserModel } from '../models/User';
import { logger } from '../observability/logger';
import { RuleSet } from '../domain/rule';

const seed = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('📦 Connected to MongoDB for seeding');

    // Clear existing rules and users
    await RuleSetModel.deleteMany({});
    await UserModel.deleteMany({});

    // Seed Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    await UserModel.create({
      email: 'admin@parcel.com',
      passwordHash,
      role: 'ADMIN',
    });
    logger.info('✅ Seeded default admin user (admin@parcel.com / admin123)');

    const defaultRules: RuleSet = {
      version: 1,
      rules: [
        {
          id: 'insurance-required',
          priority: 100,
          enabled: true,
          condition: { field: 'valueEur', operator: 'gt', value: 1000 },
          action: { type: 'REQUIRE_APPROVAL', approvalType: 'INSURANCE' },
        },
        {
          id: 'mail-routing',
          priority: 50,
          enabled: true,
          condition: { field: 'weightKg', operator: 'lte', value: 1 },
          action: { type: 'ROUTE', department: 'MAIL' },
        },
        {
          id: 'regular-routing',
          priority: 40,
          enabled: true,
          condition: { field: 'weightKg', operator: 'lte', value: 10 },
          action: { type: 'ROUTE', department: 'REGULAR' },
        },
        {
          id: 'heavy-routing',
          priority: 30,
          enabled: true,
          condition: { field: 'weightKg', operator: 'gt', value: 10 },
          action: { type: 'ROUTE', department: 'HEAVY' },
        },
      ],
    };

    const activeRuleSet = new RuleSetModel({
      version: defaultRules.version,
      status: 'ACTIVE',
      rules: defaultRules.rules,
      createdBy: 'system',
      approvedBy: 'system',
      publishedAt: new Date(),
    });

    await activeRuleSet.save();

    logger.info('✅ Seeded default active rules');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Seeding failed');
    process.exit(1);
  }
};

seed();
