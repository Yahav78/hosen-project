import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config({ path: '../.env' }); // Load from root

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to Database for seeding');

        // Check if admin exists
        const adminExists = await User.findOne({ username: 'yahav' });

        if (adminExists) {
            console.log('Admin user "yahav" already exists in the database.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('yv787878', salt);

        const admin = new User({
            firstName: 'Admin',
            lastName: 'Yahav',
            username: 'yahav',
            email: 'admin@hosen.app',
            password: hashedPassword,
            authProvider: 'local',
            role: 'admin',
            profileCompleted: true,
            status: 'safe'
        });

        await admin.save();
        console.log('Successfully created admin user: yahav');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
