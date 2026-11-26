import { Router } from 'express';
import { getAiHealth } from '../controllers/aiHealthController.js';

const router = Router();

router.get('/health', getAiHealth);

export default router;
