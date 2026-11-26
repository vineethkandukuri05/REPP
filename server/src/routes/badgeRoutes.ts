import { Router } from 'express';
import { getUserBadges } from '../controllers/badgesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getUserBadges);

export default router;
