import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    category: 'water' | 'food' | 'medicine' | 'equipment' | 'other';
    quantity: number;
    unit: string;
    factorPerPerson: number;
    daysRequired: number;
    expirationDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryItemSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['water', 'food', 'medicine', 'equipment', 'other'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    factorPerPerson: { type: Number, default: 0 },
    daysRequired: { type: Number, default: 0 },
    expirationDate: { type: Date }
}, { timestamps: true });

export default mongoose.models.InventoryItem || mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
