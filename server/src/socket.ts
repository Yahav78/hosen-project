import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import User from './models/User';
import EmergencyEvent from './models/EmergencyEvent';

const EVENT_TYPES = new Set([
    'manual_trigger',
    'audio_trigger',
    'family_trigger',
    'acoustic_alarm',
    'explosion'
]);

function normalizeEmergencyType(raw: string | undefined): string {
    if (raw && EVENT_TYPES.has(raw)) return raw;
    return 'manual_trigger';
}

export const handleSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a specific family room
        socket.on('joinFamilyRoom', (familyId: string) => {
            socket.join(familyId);
            console.log(`User ${socket.id} joined family room: ${familyId}`);
        });

        // Update status broadcast
        socket.on('updateStatus', (data: { familyId: string, userId: string, status: string, location?: any }) => {
            io.to(data.familyId).emit('statusUpdated', data);
        });

        socket.on('triggerEmergency', async (data: { familyId: string, userId: string, type: string }) => {
            io.to(data.familyId).emit('emergencyTriggered', data);

            try {
                const uid = data?.userId;
                if (!uid || !mongoose.Types.ObjectId.isValid(uid)) return;

                const eventType = normalizeEmergencyType(data.type);
                let location: { lat: number; lng: number } | undefined;
                const u = await User.findById(uid).select('location');
                if (
                    u?.location &&
                    typeof u.location.lat === 'number' &&
                    typeof u.location.lng === 'number'
                ) {
                    location = { lat: u.location.lat, lng: u.location.lng };
                }

                await EmergencyEvent.create({
                    userId: uid,
                    type: eventType,
                    location,
                    resolved: false
                });
            } catch (e) {
                console.error('EmergencyEvent persist failed:', e);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
