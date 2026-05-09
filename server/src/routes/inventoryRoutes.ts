import express from 'express';
import { getInventory, updateItemQuantity, setItemQuantity } from '../controllers/inventoryController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getInventory);
router.post('/:id/quantity', protect, updateItemQuantity);
router.patch('/:id', protect, setItemQuantity);

export default router;
