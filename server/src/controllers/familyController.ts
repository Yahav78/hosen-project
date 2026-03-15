import { Request, Response } from 'express';
import User from '../models/User';
import FamilyInvitation from '../models/FamilyInvitation';
import mongoose from 'mongoose';

// @desc    Invite a family member by email
// @route   POST /api/family/invite
// @access  Private
export const inviteFamilyMember = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    const senderId = (req as any).user.id;

    try {
        const sender = await User.findById(senderId);
        if (sender?.email === email) {
            res.status(400).json({ message: 'You cannot invite yourself' });
            return;
        }

        // Check if already connected
        const alreadyConnected = await User.findOne({
            _id: senderId,
            'familyMembers.user': { $exists: true } // Need to check inside array, will refine in response
        }).populate('familyMembers.user');

        const isConnected = alreadyConnected?.familyMembers?.some((m: any) => m.user?.email === email);
        if (isConnected) {
            res.status(400).json({ message: 'User is already in your family network' });
            return;
        }

        // Check if invitation already pending
        const pendingInvite = await FamilyInvitation.findOne({
            senderId,
            receiverEmail: email,
            status: 'pending'
        });

        if (pendingInvite) {
            res.status(400).json({ message: 'Invitation already pending' });
            return;
        }

        const receiver = await User.findOne({ email });

        const invite = await FamilyInvitation.create({
            senderId,
            receiverEmail: email,
            receiverId: receiver ? receiver._id : undefined,
            status: 'pending'
        });

        res.status(201).json({ message: 'Invitation sent successfully', invite });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending invitations for self
// @route   GET /api/family/invitations
// @access  Private
export const getPendingInvitations = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const invites = await FamilyInvitation.find({
            $or: [
                { receiverId: userId },
                { receiverEmail: user.email }
            ],
            status: 'pending'
        }).populate('senderId', 'firstName lastName username email');

        res.json(invites);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Respond to an invitation (Accept/Decline)
// @route   POST /api/family/invitations/:id/respond
// @access  Private
export const respondInvitation = async (req: Request, res: Response): Promise<void> => {
    const { action } = req.body; // 'accepted' | 'declined'
    const inviteId = req.params.id;
    const userId = (req as any).user.id;

    try {
        const invite = await FamilyInvitation.findById(inviteId);

        if (!invite || invite.status !== 'pending') {
            res.status(400).json({ message: 'Invalid or expired invitation' });
            return;
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (invite.receiverEmail.toLowerCase() !== user.email.toLowerCase() && String(invite.receiverId) !== userId) {
            res.status(403).json({ message: 'Not authorized to respond to this invite' });
            return;
        }

        if (action === 'accepted') {
            invite.status = 'accepted';
            await invite.save();

            const senderIdObj = new mongoose.Types.ObjectId(String(invite.senderId));
            const receiverIdObj = new mongoose.Types.ObjectId(String(userId));

            // Add to sender
            await User.findByIdAndUpdate(invite.senderId, {
                $addToSet: { familyMembers: { user: receiverIdObj, isFavorite: false } }
            });

            // Add to receiver
            await User.findByIdAndUpdate(userId, {
                $addToSet: { familyMembers: { user: senderIdObj, isFavorite: false } }
            });

            res.json({ message: 'Invitation accepted and family connected!' });
        } else {
            invite.status = 'declined';
            await invite.save();
            res.json({ message: 'Invitation declined' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get family members
// @route   GET /api/family
// @access  Private
export const getFamilyMembers = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const user = await User.findById(userId).populate({
            path: 'familyMembers.user',
            select: 'firstName lastName username email status lastStatusUpdate location resilienceScore',
            strictPopulate: false
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(user.familyMembers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove a family member
// @route   DELETE /api/family/:id
// @access  Private
export const removeFamilyMember = async (req: Request, res: Response): Promise<void> => {
    const memberId = req.params.id;
    const userId = (req as any).user.id;

    try {
        // Remove from self
        await User.findByIdAndUpdate(userId, {
            $pull: { familyMembers: { user: memberId } }
        });

        // Remove self from other user
        await User.findByIdAndUpdate(memberId, {
            $pull: { familyMembers: { user: userId } }
        });

        res.json({ message: 'Family member removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle favorite on family member
// @route   PATCH /api/family/:id/favorite
// @access  Private
export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
    const memberId = req.params.id;
    const userId = (req as any).user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const memberIndex = user.familyMembers.findIndex((m: any) => String(m.user) === memberId);

        if (memberIndex === -1) {
            res.status(404).json({ message: 'Family member not found' });
            return;
        }

        user.familyMembers[memberIndex].isFavorite = !user.familyMembers[memberIndex].isFavorite;
        await user.save();

        res.json({ message: 'Favorite status updated', isFavorite: user.familyMembers[memberIndex].isFavorite });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
