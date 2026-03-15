import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyEvent extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'acoustic_alarm' | 'explosion' | 'manual_trigger';
    location?: { lat: number; lng: number };
    resolved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EmergencyEventSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['acoustic_alarm', 'explosion', 'manual_trigger'], required: true },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    resolved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.EmergencyEvent || mongoose.model<IEmergencyEvent>('EmergencyEvent', EmergencyEventSchema);
