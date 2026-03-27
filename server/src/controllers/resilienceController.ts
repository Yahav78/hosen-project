import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';

export const calculateResilienceScore = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let score = 10; // Base Score
        const recommendations: any[] = [];

        // 1. Family Network Connection (20% max)
        if (user.familyMembers && user.familyMembers.length > 0) {
            const count = user.familyMembers.length;
            const points = Math.min(count * 10, 20); // 10% per member, max 20%
            score += points;
            recommendations.push({ key: 'res_family_connected', params: { count }, type: 'success' });
        } else {
            recommendations.push({ key: 'res_family_none', type: 'danger' });
        }

        // 2. Profile Completion (15%)
        if (user.profileCompleted) {
            score += 15;
            recommendations.push({ key: 'res_profile_done', type: 'success' });
        } else {
            recommendations.push({ key: 'res_profile_pending', type: 'warning' });
        }

        // 3. Status set (10%)
        if (user.status) { 
             score += 10;
             recommendations.push({ key: 'res_status_set', params: { status: user.status }, type: 'success' });
        } else {
             recommendations.push({ key: 'res_status_none', type: 'warning' });
        }

        // 4. Real Inventory Check (15% Proportional)
        const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem');
        const items = await InventoryItem.find({ userId });
        const familyCount = (user.familyMembers ? user.familyMembers.length : 0) + 1;
        
        let metCount = 0;
        let lowItems: string[] = [];
        for (const item of items) {
             const reqAmt = (item.factorPerPerson || 0) * familyCount * (item.daysRequired || 0);
             if (item.quantity >= reqAmt) {
                  metCount++;
             } else {
                  lowItems.push(item.name);
             }
        }
        
        if (items.length > 0) {
             const invScore = Math.round((metCount / items.length) * 15);
             score += invScore;
             recommendations.push({ key: 'res_inv_stocked', params: { metCount, total: items.length }, type: invScore === 15 ? 'success' : 'warning' });
             if (lowItems.length > 0) recommendations.push({ key: 'res_inv_low', params: { items: lowItems }, type: 'warning' });
        } else {
             recommendations.push({ key: 'res_inv_none', type: 'danger' });
        }

        // 5. Vault Documents (15% Proportional)
        const VaultDocument = mongoose.models.VaultDocument || mongoose.model('VaultDocument');
        const docs = await VaultDocument.find({ userId });
        if (docs.length > 0) {
             const docScore = Math.min(docs.length * 5, 15); // 5% per doc, max 15%
             score += docScore;
             recommendations.push({ key: 'res_vault_uploaded', params: { count: docs.length }, type: 'success' });
        } else {
             recommendations.push({ key: 'res_vault_none', type: 'danger' });
        }

        // 6. Map Coordinates (15%)
        if (user.location && user.location.lat && user.location.lng) {
             score += 15;
             recommendations.push({ key: 'res_map_verified', type: 'success' });
        } else {
             recommendations.push({ key: 'res_map_none', type: 'warning' });
        }

        // Cap at 100
        if (score > 100) score = 100;

        user.resilienceScore = score;
        await user.save();

        res.json({ message: 'Score updated successfully', score, recommendations });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
