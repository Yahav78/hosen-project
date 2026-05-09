import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const USERNAME = 'test';
const PASSWORD = 'test';
const EMAIL = 'test@hosen.local';

async function seedTestUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 8000 });
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(PASSWORD, salt);

        const existing = await User.findOne({ username: USERNAME });

        if (existing) {
            existing.password = hashedPassword;
            existing.profileCompleted = true;
            existing.authProvider = 'local';
            await existing.save();
            console.log(`Updated user "${USERNAME}" — password reset to "${PASSWORD}".`);
        } else {
            await User.create({
                firstName: 'Test',
                lastName: 'User',
                username: USERNAME,
                email: EMAIL,
                password: hashedPassword,
                authProvider: 'local',
                homeAddress: '—',
                role: 'user',
                profileCompleted: true,
                status: 'safe'
            });
            console.log(`Created user "${USERNAME}" / "${PASSWORD}" (${EMAIL}).`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seedTestUser();
