import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import VaultDocument from '../models/VaultDocument';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

export const upload = multer({ storage });

export const getVaultDocuments = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const docs = await VaultDocument.find({ userId });
        res.json(docs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { title, category } = req.body;

    try {
        if (!req.file) {
             res.status(400).json({ message: 'No file uploaded' });
             return;
        }

        const doc = await VaultDocument.create({
            userId,
            title: title || req.file.originalname,
            category: category || 'other',
            fileUrl: `/uploads/${req.file.filename}`
        });

        res.status(201).json({ message: 'Document uploaded successfully', doc });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as any).user.id;

    try {
        const doc = await VaultDocument.findOne({ _id: id, userId });
        if (!doc) {
             res.status(404).json({ message: 'Document not found' });
             return;
        }

        // Optional: delete from fs
        const filePath = path.join(__dirname, '..', '..', 'uploads', doc.fileUrl.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await VaultDocument.findByIdAndDelete(id);
        res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
