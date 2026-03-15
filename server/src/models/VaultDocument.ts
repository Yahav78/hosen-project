import mongoose, { Schema, Document } from 'mongoose';

export interface IVaultDocument extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    category: 'id' | 'insurance' | 'medical' | 'other';
    fileUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const VaultDocumentSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: { type: String, enum: ['id', 'insurance', 'medical', 'other'], required: true },
    fileUrl: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.VaultDocument || mongoose.model<IVaultDocument>('VaultDocument', VaultDocumentSchema);
