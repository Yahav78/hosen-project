import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User';

dotenv.config({ path: './.env' });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);

        const username = 'yahav';
        const passwordPlain = 'yv787878';
        const email = 'yahav@admin.com';

        let user = await User.findOne({ username });

        if (user) {
            console.log('User found! Overwriting password to ensure it is correct...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(passwordPlain, salt);
            user.role = 'admin';
            await user.save();
            console.log('Password updated and role set to admin.');
        } else {
            console.log('User not found. Creating a new admin account...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordPlain, salt);

            user = await User.create({
                firstName: 'Yahav',
                lastName: 'Admin',
                username: username,
                email: email,
                password: hashedPassword,
                authProvider: 'local',
                role: 'admin',
                profileCompleted: true,
                status: 'safe'
            });
            console.log('Admin account created successfully!');
        }

        console.log(`\n--- ADMIN CREDENTIALS ---`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${passwordPlain}`);
        console.log(`-------------------------\n`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedAdmin();
