import express from 'express';
import { getUsers } from '../controllers/adminController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/users', protect, admin, getUsers);

export default router;
