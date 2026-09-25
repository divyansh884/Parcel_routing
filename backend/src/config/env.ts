import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().default(3001),

  MONGODB_URI: z
    .string()
    .min(1)
    .default('mongodb://localhost:27017/parcel-routing'),

  REDIS_URL: z
    .string()
    .url()
    .default('redis://localhost:6379'),

  JWT_SECRET: z
    .string()
    .min(16)
    .default('development_secret_do_not_use_in_prod'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  process.exit(1);
}

export const env = _env.data;