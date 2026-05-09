import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { createManualEmergencyEvent, listEmergencyEvents, resolveLatestMine } from '../controllers/emergencyEventController';

const router = express.Router();

router.use(protect);

router.post('/', createManualEmergencyEvent);
router.get('/', listEmergencyEvents);
router.post('/resolve-latest', resolveLatestMine);

export default router;
