const { verifySocketToken } = require('../middleware/auth');
const { checkSocketRateLimit } = require('../middleware/rateLimit');
const { generateUniqueAnonymousName } = require('../utils/anonymousNames');
const Room = require('../models/Room');
const Message = require('../models/Message');

// Track online users per room
const roomUsers = new Map(); // roomId -> Set of { odketId, anonymousName }
const userSockets = new Map(); // odketId -> user data

const initializeSocket = (io) => {
    // Authentication middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        const user = await verifySocketToken(token);
        if (!user) {
            return next(new Error('Invalid token'));
        }

        socket.user = user;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.id})`);

        // Store user socket mapping
        userSockets.set(socket.id, {
            oderId: socket.user._id.toString(),
            username: socket.user.username
        });

        // Join a room
        socket.on('join-room', async (roomId) => {
            try {
                const room = await Room.findById(roomId);
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }

                // Check if participant
                const participant = room.participants.find(
                    p => p.userId.toString() === socket.user._id.toString()
                );

                if (!participant) {
                    socket.emit('error', { message: 'Not a participant of this room' });
                    return;
                }

                // Join socket room
                socket.join(roomId);
                socket.currentRoom = roomId;
                socket.anonymousName = participant.anonymousName;

                // Track user in room
                if (!roomUsers.has(roomId)) {
                    roomUsers.set(roomId, new Set());
                }
                roomUsers.get(roomId).add({
                    socketId: socket.id,
                    anonymousName: participant.anonymousName
                });

                // Get online users count
                const onlineCount = roomUsers.get(roomId)?.size || 0;

                // Notify room about new user
                socket.to(roomId).emit('user-joined', {
                    anonymousName: participant.anonymousName,
                    onlineCount
                });

                // Send current online count to joiner
                socket.emit('room-joined', {
                    roomId,
                    anonymousName: participant.anonymousName,
                    onlineCount
                });

                console.log(`${participant.anonymousName} joined room ${room.name}`);
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Error joining room' });
            }
        });

        // Leave room
        socket.on('leave-room', (roomId) => {
            handleLeaveRoom(socket, roomId);
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { roomId, content, selfDestruct, destructTime } = data;

                if (!content || content.trim().length === 0) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                // Rate limit check
                if (!checkSocketRateLimit(socket.user._id.toString())) {
                    socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
                    return;
                }

                // Get room and verify participation
                const room = await Room.findById(roomId);
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }

                const participant = room.participants.find(
                    p => p.userId.toString() === socket.user._id.toString()
                );

                if (!participant) {
                    socket.emit('error', { message: 'Not a participant' });
                    return;
                }

                // Calculate expiration
                let expiresAt = null;
                if (selfDestruct && destructTime) {
                    expiresAt = new Date(Date.now() + destructTime * 1000);
                }

                // Create message
                const message = await Message.create({
                    room: roomId,
                    senderUserId: socket.user._id,
                    anonymousName: participant.anonymousName,
                    content: content.trim(),
                    isSelfDestructing: !!selfDestruct,
                    expiresAt
                });

                // Update room activity
                room.lastActivity = new Date();
                await room.save();

                const messageData = {
                    _id: message._id,
                    anonymousName: message.anonymousName,
                    content: message.content,
                    createdAt: message.createdAt,
                    isSelfDestructing: message.isSelfDestructing
                };

                // Broadcast to room (including sender)
                io.to(roomId).emit('new-message', messageData);

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Typing indicator
        socket.on('typing-start', (roomId) => {
            if (socket.anonymousName) {
                socket.to(roomId).emit('user-typing', {
                    anonymousName: socket.anonymousName,
                    isTyping: true
                });
            }
        });

        socket.on('typing-stop', (roomId) => {
            if (socket.anonymousName) {
                socket.to(roomId).emit('user-typing', {
                    anonymousName: socket.anonymousName,
                    isTyping: false
                });
            }
        });

        // Get online users
        socket.on('get-online-users', (roomId) => {
            const users = roomUsers.get(roomId);
            const onlineUsers = users
                ? Array.from(users).map(u => u.anonymousName)
                : [];

            socket.emit('online-users', {
                roomId,
                users: onlineUsers,
                count: onlineUsers.length
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username} (${socket.id})`);

            // Leave current room if any
            if (socket.currentRoom) {
                handleLeaveRoom(socket, socket.currentRoom);
            }

            userSockets.delete(socket.id);
        });
    });

    // Helper function to handle leaving room
    const handleLeaveRoom = (socket, roomId) => {
        socket.leave(roomId);

        // Remove from tracking
        const users = roomUsers.get(roomId);
        if (users) {
            users.forEach(user => {
                if (user.socketId === socket.id) {
                    users.delete(user);
                }
            });

            const onlineCount = users.size;

            // Notify room
            socket.to(roomId).emit('user-left', {
                anonymousName: socket.anonymousName,
                onlineCount
            });

            // Clean up empty rooms
            if (users.size === 0) {
                roomUsers.delete(roomId);
            }
        }

        socket.currentRoom = null;
        socket.anonymousName = null;
    };
};

module.exports = { initializeSocket };
