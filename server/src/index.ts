import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

mongoose.set('strictPopulate', false);
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';

dotenv.config({ path: '../.env' });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Connect to Database
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Socket.io injection into request
app.use((req, res, next) => {
    (req as any).io = io;
    next();
});

// Routes
import authRoutes from './routes/authRoutes';
import familyRoutes from './routes/familyRoutes';
import resilienceRoutes from './routes/resilienceRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/resilience', resilienceRoutes);
import inventoryRoutes from './routes/inventoryRoutes';
app.use('/api/inventory', inventoryRoutes);

import vaultRoutes from './routes/vaultRoutes';
app.use('/api/vault', vaultRoutes);

import adminRoutes from './routes/adminRoutes';
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Basic Route
app.get('/', (req, res) => {
    res.send('HOSEN API is running...');
});

import User from './models/User';
import FamilyInvitation from './models/FamilyInvitation';

app.get('/api/debug-db', async (req, res) => {
    try {
        const users = await User.find({}, 'email familyMembers firstName lastName');
        const invites = await FamilyInvitation.find({});
        res.json({ users, invites });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/debug-test', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const fPath = path.resolve(__dirname, 'models', 'User.ts');
        let content = 'File not found';
        if (fs.existsSync(fPath)) {
            content = fs.readFileSync(fPath, 'utf8');
        }
        res.json({ 
            fPath, 
            length: content.length, 
            hasField: content.includes('familyMembers'),
            isLoaded: !!User.schema.paths['familyMembers.user'],
            paths: Object.keys(User.schema.paths)
        });
    } catch (err: any) {
        res.status(200).json({ error: err.message, stack: err.stack });
    }
});

app.get('/api/debug-reset', async (req, res) => {
    try {
        await FamilyInvitation.updateMany({}, { status: 'pending' });
        await User.updateMany({}, { $set: { familyMembers: [] } });
        res.send('Database relations reset for re-testing. Please refresh Dashboard.');
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Socket.io handler
import { handleSockets } from './socket';
handleSockets(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
