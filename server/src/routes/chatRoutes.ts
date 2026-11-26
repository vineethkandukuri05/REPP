import { Router } from 'express';
import { getChatHistory, streamChat, clearChat } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/history', getChatHistory);
router.post('/stream', aiRateLimiter, streamChat);
router.delete('/clear', clearChat);

export default router;
