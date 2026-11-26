import { Router } from 'express';
import {
  getReports,
  uploadAndAnalyze,
  servePrivatePhoto,
  deleteAllPhotos
} from '../controllers/bodyVisionController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPrivateImage } from '../middleware/upload.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// <img> tags can't send an Authorization header, so photo links may carry the token as ?token=.
router.use('/photo', (req, _res, next) => {
  if (!req.headers.authorization && typeof req.query.token === 'string') {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});
router.use(requireAuth);

router.get('/reports', getReports);
router.post(
  '/upload',
  aiRateLimiter,
  uploadPrivateImage.fields([
    { name: 'front', maxCount: 1 },
    { name: 'side', maxCount: 1 },
    { name: 'back', maxCount: 1 }
  ]),
  uploadAndAnalyze
);
router.get('/photo/:filename', servePrivatePhoto);
router.delete('/delete-all', deleteAllPhotos);

export default router;
