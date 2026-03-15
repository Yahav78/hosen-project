import express from 'express';
import { getInventory, updateItemQuantity } from '../controllers/inventoryController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getInventory);
router.post('/:id/quantity', protect, updateItemQuantity);

export default router;
