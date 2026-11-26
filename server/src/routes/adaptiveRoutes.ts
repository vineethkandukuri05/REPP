import { Router } from 'express';
import {
  getOverview,
  generatePlan,
  listPlans,
  getPlan,
  decideRecommendation,
  customizePlan,
  resetPlan,
  discardPlan,
  acceptPlan,
  generateAiSummary,
  getFeedback,
  saveFeedback
} from '../controllers/adaptiveController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/feedback', getFeedback);
router.post('/feedback', saveFeedback);

router.get('/plans', listPlans);
router.post('/plans/generate', generatePlan);
router.get('/plans/:id', getPlan);
router.patch('/plans/:id', customizePlan);
router.patch('/plans/:id/recommendations/:recId', decideRecommendation);
router.post('/plans/:id/reset', resetPlan);
router.post('/plans/:id/accept', acceptPlan);
router.delete('/plans/:id', discardPlan);
router.post('/plans/:id/ai-summary', aiRateLimiter, generateAiSummary);

export default router;
