import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
    inviteFamilyMember,
    getPendingInvitations,
    respondInvitation,
    getFamilyMembers,
    removeFamilyMember,
    toggleFavorite
} from '../controllers/familyController';

const router = express.Router();

router.use(protect);

router.post('/invite', inviteFamilyMember);
router.get('/invitations', getPendingInvitations);
router.post('/invitations/:id/respond', respondInvitation);
router.get('/', getFamilyMembers);
router.delete('/:id', removeFamilyMember);
router.patch('/:id/favorite', toggleFavorite);

export default router;
