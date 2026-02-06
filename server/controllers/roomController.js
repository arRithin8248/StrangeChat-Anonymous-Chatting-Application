const Room = require('../models/Room');
const Message = require('../models/Message');
const { generateUniqueAnonymousName } = require('../utils/anonymousNames');

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Private
 */
const createRoom = async (req, res) => {
    try {
        const { name, type, expiresIn, maxParticipants } = req.body;

        // Calculate expiration time
        let expiresAt = null;
        if (expiresIn) {
            const hours = parseInt(expiresIn);
            if (hours > 0) {
                expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
            }
        } else {
            // Default 24 hours
            expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        // Generate anonymous name for creator
        const anonymousName = generateUniqueAnonymousName([]);

        const room = await Room.create({
            name,
            type: type || 'group',
            createdBy: req.user._id,
            expiresAt,
            maxParticipants: maxParticipants || 50,
            isTemporary: expiresAt !== null,
            participants: [{
                userId: req.user._id,
                anonymousName
            }]
        });

        res.status(201).json({
            ...room.toObject(),
            myAnonymousName: anonymousName
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Error creating room' });
    }
};

/**
 * @desc    Get all rooms for current user
 * @route   GET /api/rooms
 * @access  Private
 */
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            'participants.userId': req.user._id
        }).sort({ lastActivity: -1 });

        // Get last message for each room
        const roomsWithLastMessage = await Promise.all(
            rooms.map(async (room) => {
                const lastMessage = await Message.findOne({ room: room._id })
                    .sort({ createdAt: -1 })
                    .select('content anonymousName createdAt');

                const myParticipant = room.participants.find(
                    p => p.userId.toString() === req.user._id.toString()
                );

                return {
                    ...room.toObject(),
                    lastMessage: lastMessage ? {
                        content: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
                        anonymousName: lastMessage.anonymousName,
                        createdAt: lastMessage.createdAt
                    } : null,
                    myAnonymousName: myParticipant?.anonymousName,
                    participantCount: room.participants.length
                };
            })
        );

        res.json(roomsWithLastMessage);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Error fetching rooms' });
    }
};

/**
 * @desc    Get public/available rooms
 * @route   GET /api/rooms/available
 * @access  Private
 */
const getAvailableRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            type: 'group',
            $expr: { $lt: [{ $size: '$participants' }, '$maxParticipants'] }
        })
            .select('name type participantCount maxParticipants createdAt expiresAt')
            .sort({ createdAt: -1 })
            .limit(20);

        const roomsWithCount = rooms.map(room => ({
            ...room.toObject(),
            participantCount: room.participants?.length || 0
        }));

        res.json(roomsWithCount);
    } catch (error) {
        console.error('Get available rooms error:', error);
        res.status(500).json({ message: 'Error fetching available rooms' });
    }
};

/**
 * @desc    Join a room
 * @route   POST /api/rooms/:id/join
 * @access  Private
 */
const joinRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if already a participant
        const isParticipant = room.participants.some(
            p => p.userId.toString() === req.user._id.toString()
        );

        if (isParticipant) {
            const myParticipant = room.participants.find(
                p => p.userId.toString() === req.user._id.toString()
            );
            return res.json({
                ...room.toObject(),
                myAnonymousName: myParticipant.anonymousName
            });
        }

        // Check max participants
        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({ message: 'Room is full' });
        }

        // Generate unique anonymous name
        const existingNames = room.participants.map(p => p.anonymousName);
        const anonymousName = generateUniqueAnonymousName(existingNames);

        // Add participant
        room.participants.push({
            userId: req.user._id,
            anonymousName
        });
        room.lastActivity = new Date();
        await room.save();

        res.json({
            ...room.toObject(),
            myAnonymousName: anonymousName
        });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ message: 'Error joining room' });
    }
};

/**
 * @desc    Leave a room
 * @route   POST /api/rooms/:id/leave
 * @access  Private
 */
const leaveRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Remove participant
        room.participants = room.participants.filter(
            p => p.userId.toString() !== req.user._id.toString()
        );

        // If room is empty, delete it
        if (room.participants.length === 0) {
            await Room.findByIdAndDelete(req.params.id);
            await Message.deleteMany({ room: req.params.id });
            return res.json({ message: 'Left room and room was deleted (empty)' });
        }

        await room.save();
        res.json({ message: 'Left room successfully' });
    } catch (error) {
        console.error('Leave room error:', error);
        res.status(500).json({ message: 'Error leaving room' });
    }
};

/**
 * @desc    Get single room details
 * @route   GET /api/rooms/:id
 * @access  Private
 */
const getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if user is participant
        const myParticipant = room.participants.find(
            p => p.userId.toString() === req.user._id.toString()
        );

        if (!myParticipant) {
            return res.status(403).json({ message: 'Not a participant of this room' });
        }

        res.json({
            ...room.toObject(),
            myAnonymousName: myParticipant.anonymousName,
            participantCount: room.participants.length
        });
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ message: 'Error fetching room' });
    }
};

/**
 * @desc    Delete a room (admin/creator only)
 * @route   DELETE /api/rooms/:id
 * @access  Private
 */
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check permissions
        const isCreator = room.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this room' });
        }

        // Delete room and its messages
        await Room.findByIdAndDelete(req.params.id);
        await Message.deleteMany({ room: req.params.id });

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ message: 'Error deleting room' });
    }
};

module.exports = {
    createRoom,
    getRooms,
    getAvailableRooms,
    joinRoom,
    leaveRoom,
    getRoom,
    deleteRoom
};
