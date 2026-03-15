import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyInvitation extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverEmail: string;
    receiverId?: mongoose.Types.ObjectId; // Populated if user already exists
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
    updatedAt: Date;
}

const FamilyInvitationSchema: Schema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverEmail: { type: String, required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, { timestamps: true });

export default mongoose.models.FamilyInvitation || mongoose.model<IFamilyInvitation>('FamilyInvitation', FamilyInvitationSchema);
