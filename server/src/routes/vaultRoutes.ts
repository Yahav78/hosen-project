import express from 'express';
import { getVaultDocuments, uploadDocument, deleteDocument, upload } from '../controllers/vaultController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getVaultDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.delete('/:id', protect, deleteDocument);

export default router;
