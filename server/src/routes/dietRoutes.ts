import { Router } from 'express';
import {
  getActivePlan,
  generatePlan,
  swapMeal,
  toggleMeal,
  updateMeal
} from '../controllers/dietController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/active', getActivePlan);
router.post('/generate', aiRateLimiter, generatePlan);
router.post('/swap/:mealId', aiRateLimiter, swapMeal);
router.post('/toggle/:mealId', toggleMeal);
router.put('/update/:mealId', updateMeal);

export default router;
