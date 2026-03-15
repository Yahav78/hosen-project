import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        let items = await InventoryItem.find({ userId });

        if (items.length === 0) {
            // Seed defaults
            const defaults = [
                { userId, name: 'Mineral Water', category: 'water', quantity: 0, unit: 'Liters', factorPerPerson: 3, daysRequired: 3 },
                { userId, name: 'Canned Food', category: 'food', quantity: 0, unit: 'Cans', factorPerPerson: 2, daysRequired: 3 },
                { userId, name: 'First Aid Kit', category: 'medicine', quantity: 1, unit: 'kit', factorPerPerson: 0, daysRequired: 0 },
                { userId, name: 'Battery Radio', category: 'equipment', quantity: 1, unit: 'unit', factorPerPerson: 0, daysRequired: 0 }
            ];
            items = await InventoryItem.insertMany(defaults);
        }

        res.json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateItemQuantity = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { action } = req.body; // 'increment' | 'decrement'

    try {
        const item = await InventoryItem.findById(id);
        if (!item) {
             res.status(404).json({ message: 'Item not found' });
             return;
        }

        if (action === 'increment') {
            item.quantity += 1;
        } else if (action === 'decrement' && item.quantity > 0) {
            item.quantity -= 1;
        }

        await item.save();
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
