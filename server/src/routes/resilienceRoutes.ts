import express from 'express';
import { calculateResilienceScore } from '../controllers/resilienceController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/calculate', protect, calculateResilienceScore);

export default router;
