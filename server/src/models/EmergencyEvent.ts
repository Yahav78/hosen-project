import mongoose, { Schema, Document } from 'mongoose';

export type EmergencyEventType =
    | 'manual_trigger'
    | 'audio_trigger'
    | 'family_trigger'
    | 'acoustic_alarm'
    | 'explosion';

export interface IEmergencyEvent extends Document {
    userId: mongoose.Types.ObjectId;
    type: EmergencyEventType;
    location?: { lat: number; lng: number };
    resolved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EmergencyEventSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['manual_trigger', 'audio_trigger', 'family_trigger', 'acoustic_alarm', 'explosion'],
        required: true
    },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    resolved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.EmergencyEvent || mongoose.model<IEmergencyEvent>('EmergencyEvent', EmergencyEventSchema);
