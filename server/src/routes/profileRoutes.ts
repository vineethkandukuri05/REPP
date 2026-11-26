import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  completeOnboarding,
  changePassword,
  exportData,
  deleteAccount
} from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { blockDemo } from '../middleware/blockDemo.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/onboarding', completeOnboarding);
router.post('/change-password', blockDemo, changePassword);
router.get('/export', exportData);
router.delete('/delete-account', blockDemo, deleteAccount);

export default router;
