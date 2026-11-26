import { Router } from 'express';
import {
  getTodayWorkout,
  generateWorkout,
  toggleExerciseSet,
  substituteExercise,
  completeWorkout,
  getWorkoutHistory
} from '../controllers/workoutController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/today', getTodayWorkout);
router.post('/generate', aiRateLimiter, generateWorkout);
router.post('/set/:exerciseId', toggleExerciseSet);
router.post('/substitute/:exerciseId', aiRateLimiter, substituteExercise);
router.post('/complete', completeWorkout);
router.get('/history', getWorkoutHistory);

export default router;
