import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { firebaseAdmin } from '../lib/firebase-admin';
import prisma from '../lib/prisma';

class SocketService {
    private io: Server | null = null;

    initialize(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        const timetablesNs = this.io.of('/timetables');

        // Middleware for authentication via Firebase
        timetablesNs.use(async (socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            try {
                // Verify Firebase ID Token
                const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
                const { uid, email } = decodedToken;

                // Lookup user in our local DB
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { firebaseUid: uid },
                            { email: email }
                        ]
                    }
                });

                if (!user) {
                    return next(new Error('User not registered in local database'));
                }

                // Attach user data to socket
                (socket as any).user = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    entityId: user.entityId,
                    universityId: user.universityId,
                    email: user.email
                };

                next();
            } catch (err) {
                console.error('[Socket.io] Auth Error:', err);
                return next(new Error('Invalid or expired Firebase token'));
            }
        });

        timetablesNs.on('connection', (socket: Socket) => {
            const user = (socket as any).user;

            // Join specific rooms based on role
            if (user.role === 'SUPERADMIN') {
                socket.join('superadmin');
            } else if (user.role === 'UNI_ADMIN' && user.universityId) {
                socket.join(`uni-${user.universityId}`);
            } else if (user.role === 'DEPT_ADMIN' && user.entityId) {
                socket.join(`dept-${user.entityId}`);
            } else if (user.role === 'FACULTY' && user.entityId) {
                socket.join(`faculty-${user.entityId}`);
            }

            console.log(`[Socket.io] User ${user.username} connected. Role: ${user.role}`);

            socket.on('disconnect', () => {
                console.log(`[Socket.io] User ${user.username} disconnected.`);
            });
        });

        console.log('[Socket.io] Service initialized.');
    }

    // Broadcast a new timetable generation to a specific department room
    // and broadcast to all faculty members within that department.
    broadcastTimetableGenerated(departmentId: string, generationDetails: any) {
        if (!this.io) return;

        // Notify the department administrators
        this.io.of('/timetables').to(`dept-${departmentId}`).emit('timetable:generated', generationDetails);

        // Ideally we'd map faculty explicitly, but for simplicity, we trigger a global 'schedule:updated'
        // signal mapped back to the department origin allowing clients to react appropriately.
        // A more complex setup would loop through affected Faculty IDs and emit `to(faculty-${id})`.
        this.io.of('/timetables').emit('schedule:updated', { departmentId, ...generationDetails });
    }
}

export const socketService = new SocketService();
