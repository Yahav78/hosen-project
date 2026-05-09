import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import EmergencyEvent from '../models/EmergencyEvent';

function familyUserIds(user: IUser): mongoose.Types.ObjectId[] {
    const self = new mongoose.Types.ObjectId(String(user._id));
    const fromMembers = (user.familyMembers || [])
        .map((m: { user?: mongoose.Types.ObjectId }) => m.user)
        .filter(Boolean)
        .map((id) => new mongoose.Types.ObjectId(String(id)));
    return [self, ...fromMembers];
}

// @desc    List emergency events for me + my family network
// @route   GET /api/emergency-events
// @access  Private
export const listEmergencyEvents = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const ids = familyUserIds(user);
        const events = await EmergencyEvent.find({ userId: { $in: ids } })
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('userId', 'firstName lastName email');

        res.json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark my most recent unresolved emergency as resolved (e.g. "I'm safe")
// @route   POST /api/emergency-events/resolve-latest
// @access  Private
export const resolveLatestMine = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const updated = await EmergencyEvent.findOneAndUpdate(
            { userId, resolved: false },
            { resolved: true },
            { sort: { createdAt: -1 }, new: true }
        );
        res.json({ ok: true, event: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
