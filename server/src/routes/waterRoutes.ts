import { Router } from 'express';
import { getWaterIntake, updateWaterIntake } from '../controllers/waterController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWaterIntake);
router.post('/update', updateWaterIntake);

export default router;
