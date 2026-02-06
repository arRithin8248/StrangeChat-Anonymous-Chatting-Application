const Message = require('../models/Message');
const Room = require('../models/Room');

/**
 * @desc    Get messages for a room
 * @route   GET /api/messages/:roomId
 * @access  Private
 */
const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify user is participant
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const isParticipant = room.participants.some(
            p => p.userId.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Not a participant of this room' });
        }

        // Get paginated messages
        const messages = await Message.find({ room: roomId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('anonymousName content createdAt isSelfDestructing senderUserId');

        // Get my anonymous name to identify own messages
        const myParticipant = room.participants.find(
            p => p.userId.toString() === req.user._id.toString()
        );

        // Mark messages and identify own
        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            anonymousName: msg.anonymousName,
            content: msg.content,
            createdAt: msg.createdAt,
            isSelfDestructing: msg.isSelfDestructing,
            isOwn: msg.senderUserId.toString() === req.user._id.toString()
        })).reverse();

        const total = await Message.countDocuments({ room: roomId });

        res.json({
            messages: formattedMessages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

/**
 * @desc    Send a message (REST fallback - Socket.IO preferred)
 * @route   POST /api/messages/:roomId
 * @access  Private
 */
const sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content, selfDestruct, destructTime } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Verify user is participant
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const participant = room.participants.find(
            p => p.userId.toString() === req.user._id.toString()
        );

        if (!participant) {
            return res.status(403).json({ message: 'Not a participant of this room' });
        }

        // Calculate expiration for self-destructing messages
        let expiresAt = null;
        if (selfDestruct && destructTime) {
            expiresAt = new Date(Date.now() + destructTime * 1000);
        }

        const message = await Message.create({
            room: roomId,
            senderUserId: req.user._id,
            anonymousName: participant.anonymousName,
            content: content.trim(),
            isSelfDestructing: !!selfDestruct,
            expiresAt
        });

        // Update room last activity
        room.lastActivity = new Date();
        await room.save();

        res.status(201).json({
            _id: message._id,
            anonymousName: message.anonymousName,
            content: message.content,
            createdAt: message.createdAt,
            isSelfDestructing: message.isSelfDestructing,
            isOwn: true
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

/**
 * @desc    Delete own message
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check ownership
        if (message.senderUserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(req.params.messageId);
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Error deleting message' });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    deleteMessage
};
