import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    authProvider: 'local' | 'google';
    homeAddress?: string;
    role: 'user' | 'admin';
    profileCompleted: boolean;
    status: 'safe' | 'in-danger' | 'unknown';
    lastStatusUpdate: Date;
    location?: { lat: number; lng: number };
    resilienceScore: number;
    familyMembers: {
        user: mongoose.Types.ObjectId;
        isFavorite: boolean;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    firstName: { type: String, required: function (this: any) { return this.profileCompleted; } },
    lastName: { type: String, required: function (this: any) { return this.profileCompleted; } },
    username: {
        type: String,
        unique: true,
        sparse: true,
        required: function (this: any) { return this.profileCompleted; }
    },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], required: true },
    homeAddress: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profileCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ['safe', 'in-danger', 'unknown'], default: 'unknown' },
    lastStatusUpdate: { type: Date, default: Date.now },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    resilienceScore: { type: Number, default: 0 },
    familyMembers: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        isFavorite: { type: Boolean, default: false }
    }]
}, { timestamps: true, strictPopulate: false });

if (mongoose.models.User) {
    delete mongoose.models.User;
}
export default mongoose.model<IUser>('User', UserSchema);

export const modelFilePath = __filename;
