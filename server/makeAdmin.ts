import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config({ path: './.env' });

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const res = await User.updateMany({}, { role: 'admin' });
        console.log(`Successfully elevated ${res.modifiedCount} users to Admin.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

makeAdmin();
