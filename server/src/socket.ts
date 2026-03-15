import { Server, Socket } from 'socket.io';

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

        socket.on('triggerEmergency', (data: { familyId: string, userId: string, type: string }) => {
            io.to(data.familyId).emit('emergencyTriggered', data);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
