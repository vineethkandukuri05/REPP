import { Router } from 'express';
import {
  getProgressData,
  logMeasurement,
  generateReport,
  getMeasurementReminder
} from '../controllers/progressController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/data', getProgressData);
router.post('/log', logMeasurement);
router.post('/report', generateReport);
router.get('/reminder', getMeasurementReminder);

export default router;
