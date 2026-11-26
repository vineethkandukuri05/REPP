import { Router } from 'express';
import {
  getGroceryList,
  addItem,
  toggleItem,
  deleteItem,
  regenerateList
} from '../controllers/groceryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/items', getGroceryList);
router.post('/add', addItem);
router.post('/toggle/:id', toggleItem);
router.delete('/:id', deleteItem);
router.post('/regenerate', regenerateList);

export default router;
