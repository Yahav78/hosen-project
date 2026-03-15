import mongoose from 'mongoose';
import connectDB from './src/config/db';
import User from './src/models/User';
import FamilyInvitation from './src/models/FamilyInvitation';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const run = async () => {
    await connectDB();

    console.log("--- USERS ---");
    const users = await User.find({}, 'email familyMembers');
    console.log(JSON.stringify(users, null, 2));

    console.log("--- INVITATIONS ---");
    const invites = await FamilyInvitation.find({});
    console.log(JSON.stringify(invites, null, 2));

    process.exit(0);
};

run();
