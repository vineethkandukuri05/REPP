import { Router } from 'express';
import { register, login, demoLogin, logout, getCurrentUser, googleLogin, getAuthConfig } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleLogin);
router.post('/demo', authRateLimiter, demoLogin);
router.post('/forgot-password', authRateLimiter, requestPasswordReset);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/config', getAuthConfig);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
