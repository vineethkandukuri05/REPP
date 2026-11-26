import './utils/asyncErrors.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';
import { resetDemoAccount } from './utils/demoReset.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import aiHealthRoutes from './routes/aiHealthRoutes.js';
import dietRoutes from './routes/dietRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import mealLogRoutes from './routes/mealLogRoutes.js';
import bodyVisionRoutes from './routes/bodyVisionRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adaptiveRoutes from './routes/adaptiveRoutes.js';
import groceryRoutes from './routes/groceryRoutes.js';
import waterRoutes from './routes/waterRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';

const app = express();

// Behind Vercel's proxy: use the real client IP for rate limits.
app.set('trust proxy', 1);

// Security and standard middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for general meal uploads
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiHealthRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealLogRoutes);
app.use('/api/bodyvision', bodyVisionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/adaptive', adaptiveRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/badges', badgeRoutes);

// Daily demo reset for serverless hosting (Vercel Cron calls this with CRON_SECRET).
app.get('/api/internal/demo-reset', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const done = await resetDemoAccount(new PrismaClient());
  res.json({ reset: done });
});

// Error Handling Middleware
app.use(errorHandler);

// Last-resort safety net: log instead of crashing the whole server.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

export default app;
