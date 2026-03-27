import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // load URI from root .env

async function flushInventory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        await mongoose.connection.collection('inventoryitems').drop().catch(() => console.log('Already dropped or non-existent'));
        console.log('Successfully flushed legacy inventory. Next refresh will map new 5 defaults arrays.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

flushInventory();
