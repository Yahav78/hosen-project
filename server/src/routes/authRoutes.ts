import express from 'express';
import User from '../models/User';
import {
    registerUser,
    loginUser,
    googleLogin,
    completeProfile,
    getUserProfile
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.put('/complete-profile', protect, completeProfile);
router.get('/profile', protect, getUserProfile);

// Temporary backdoor: Make ALL Users Admin
router.get('/make-admin-all', async (req, res) => {
    try {
        const result = await User.updateMany({}, { role: 'admin' });
        res.json({ message: `Elevated ${result.modifiedCount} users to admin.` });
    } catch (err) {
        res.status(500).json(err);
    }
});

import bcrypt from 'bcryptjs';
// Seed Yahav
router.get('/seed-yahav', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('yv787878', salt);
        let user = await User.findOne({ username: 'yahav' });
        if (user) {
            user.password = password;
            user.role = 'admin';
            await user.save();
        } else {
            user = await User.create({
                firstName: 'Yahav',
                lastName: 'Admin',
                username: 'yahav',
                email: 'yahav@admin.com',
                password,
                authProvider: 'local',
                role: 'admin',
                profileCompleted: true,
                status: 'safe'
            });
        }
        res.json({ message: 'Yahav admin ready!', username: 'yahav', password: 'yv787878' });
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
