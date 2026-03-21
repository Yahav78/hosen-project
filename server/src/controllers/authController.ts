import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, username, email, password, homeAddress } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            res.status(400).json({ message: 'Username is already taken' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            authProvider: 'local',
            homeAddress,
            profileCompleted: true,
            status: 'safe'
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                profileCompleted: user.profileCompleted,
                token: generateToken(user.id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { identifier, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileCompleted: user.profileCompleted,
                token: generateToken(user.id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            res.status(400).json({ message: 'Failed to verify Google token' });
            return;
        }

        const payload = await response.json();

        if (!payload?.email) {
            res.status(400).json({ message: 'Google token invalid' });
            return;
        }

        let user = await User.findOne({ email: payload.email });

        if (!user) {
            // Create incomplete profile
            user = await User.create({
                email: payload.email,
                authProvider: 'google',
                profileCompleted: false, // Mandatory completion step needed
                status: 'safe'
            });
        }

        res.json({
            _id: user.id,
            email: user.email,
            profileCompleted: user.profileCompleted,
            token: generateToken(user.id)
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete Google User Profile
// @route   PUT /api/auth/complete-profile
// @access  Private
export const completeProfile = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, username } = req.body;
    const userId = (req as any).user.id;

    try {
        const usernameExists = await User.findOne({ username });
        if (usernameExists && String(usernameExists._id) !== userId) {
            res.status(400).json({ message: 'Username is already taken' });
            return;
        }

        const user = await User.findById(userId);

        if (user) {
            user.firstName = firstName;
            user.lastName = lastName;
            user.username = username;
            user.profileCompleted = true; // Mark as complete!

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                profileCompleted: updatedUser.profileCompleted,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile (Self)
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        const user = await User.findById(userId).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user location
// @route   POST /api/auth/location
// @access  Private
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
    const { lat, lng } = req.body;
    const userId = (req as any).user.id;

    try {
        const user = await User.findById(userId);

        if (user) {
            user.location = { lat, lng };
            await user.save();

            if ((req as any).io) {
                (req as any).io.emit('locationUpdated', { userId, location: { lat, lng } });
            }

            res.json({ message: 'Location updated successfully', location: user.location });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
