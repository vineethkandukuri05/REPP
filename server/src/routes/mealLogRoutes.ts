import { Router } from 'express';
import {
  parseTextMeal,
  parsePhotoMeal,
  saveMealLog,
  getTodayLogs,
  getTodaySummary,
  deleteMealLog
} from '../controllers/mealLogController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.post('/parse-text', aiRateLimiter, parseTextMeal);
router.post('/parse-photo', aiRateLimiter, uploadImage.single('photo'), parsePhotoMeal);
router.post('/log', saveMealLog);
router.get('/today', getTodayLogs);
router.get('/summary', getTodaySummary);
router.delete('/:id', deleteMealLog);

export default router;
