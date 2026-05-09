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

const TITLE_MAX = 200;

// @desc    Document a named emergency in the shared family log (manual entry)
// @route   POST /api/emergency-events
// @access  Private
export const createManualEmergencyEvent = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const raw = req.body?.title;
    const title = typeof raw === 'string' ? raw.trim() : '';

    if (!title || title.length > TITLE_MAX) {
        res.status(400).json({
            message: title ? `Title must be at most ${TITLE_MAX} characters` : 'Title is required'
        });
        return;
    }

    try {
        let location: { lat: number; lng: number } | undefined;
        const u = await User.findById(userId).select('location');
        if (
            u?.location &&
            typeof u.location.lat === 'number' &&
            typeof u.location.lng === 'number'
        ) {
            location = { lat: u.location.lat, lng: u.location.lng };
        }

        const created = await EmergencyEvent.create({
            userId,
            type: 'manual_trigger',
            title,
            location,
            resolved: false
        });

        const populated = await EmergencyEvent.findById(created._id)
            .populate('userId', 'firstName lastName email');

        res.status(201).json(populated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

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

// @desc    Update title on my emergency event (family log)
// @route   PATCH /api/emergency-events/:id
// @access  Private
export const updateEmergencyEvent = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const id = String(req.params.id ?? '');

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }

    const raw = req.body?.title;
    if (typeof raw !== 'string') {
        res.status(400).json({ message: 'title must be a string' });
        return;
    }

    const title = raw.trim();
    if (title.length > TITLE_MAX) {
        res.status(400).json({ message: `Title must be at most ${TITLE_MAX} characters` });
        return;
    }

    try {
        const ev = await EmergencyEvent.findById(id);
        if (!ev) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        if (String(ev.userId) !== String(userId)) {
            res.status(403).json({ message: 'You can only edit your own events' });
            return;
        }

        ev.title = title.length > 0 ? title : undefined;
        await ev.save();

        const populated = await EmergencyEvent.findById(ev._id).populate(
            'userId',
            'firstName lastName email'
        );
        res.json(populated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete my emergency event from the log
// @route   DELETE /api/emergency-events/:id
// @access  Private
export const deleteEmergencyEvent = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const id = String(req.params.id ?? '');

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }

    try {
        const ev = await EmergencyEvent.findById(id);
        if (!ev) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        if (String(ev.userId) !== String(userId)) {
            res.status(403).json({ message: 'You can only delete your own events' });
            return;
        }

        await EmergencyEvent.deleteOne({ _id: id });
        res.json({ ok: true });
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
