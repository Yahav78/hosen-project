import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        let items = await InventoryItem.find({ userId });

        // Seed missing defaults unconditionally
        const defaults = [
            { userId, name: 'Mineral Water', category: 'water', quantity: 0, unit: 'Liters', factorPerPerson: 3, daysRequired: 3 },
            { userId, name: 'Food (Cans & Snacks)', category: 'food', quantity: 0, unit: 'Items', factorPerPerson: 3, daysRequired: 3 },
            { userId, name: 'Personal Flashlight', category: 'equipment', quantity: 0, unit: 'Units', factorPerPerson: 1, daysRequired: 1 },
            { userId, name: 'First Aid & Hygiene', category: 'medicine', quantity: 0, unit: 'Kits', factorPerPerson: 1, daysRequired: 1 },
            { userId, name: 'Comm & Clothes Bag', category: 'other', quantity: 0, unit: 'Bags', factorPerPerson: 1, daysRequired: 1 }
        ];

        const missingDefaults = defaults.filter(def => !items.some(item => item.name === def.name));
        
        if (missingDefaults.length > 0) {
            const inserted = await InventoryItem.insertMany(missingDefaults);
            items = [...items, ...inserted];
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
