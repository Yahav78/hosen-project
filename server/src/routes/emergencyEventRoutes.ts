import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
    createManualEmergencyEvent,
    deleteEmergencyEvent,
    listEmergencyEvents,
    resolveLatestMine,
    updateEmergencyEvent
} from '../controllers/emergencyEventController';

const router = express.Router();

router.use(protect);

router.post('/', createManualEmergencyEvent);
router.get('/', listEmergencyEvents);
router.post('/resolve-latest', resolveLatestMine);
router.patch('/:id', updateEmergencyEvent);
router.delete('/:id', deleteEmergencyEvent);

export default router;
