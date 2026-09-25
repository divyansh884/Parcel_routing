import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

import { logger } from './observability/logger';
import { errorHandler } from './middleware/errorHandler';

import { parcelRoutes } from './routes/parcelRoutes';
import { ruleRoutes } from './routes/ruleRoutes';
import { batchRoutes } from './routes/batchRoutes';
import { authRoutes } from './routes/authRoutes';
import { cloudinaryRoutes } from './routes/cloudinaryRoutes';
import { departmentRoutes } from './routes/departmentRoutes';
import { rateLimit } from 'express-rate-limit';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Global Rate Limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, 
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests from this IP, please try again later.' } }
});
app.use(limiter);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'READY' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/departments', departmentRoutes);

app.use(errorHandler);

export { app };