import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
