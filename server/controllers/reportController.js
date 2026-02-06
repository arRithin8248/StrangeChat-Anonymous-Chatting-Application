const Report = require('../models/Report');
const Room = require('../models/Room');
const User = require('../models/User');

/**
 * @desc    Create a report
 * @route   POST /api/reports
 * @access  Private
 */
const createReport = async (req, res) => {
    try {
        const { roomId, anonymousNameReported, reason, description } = req.body;

        // Get room and find reported user
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Find participant by anonymous name
        const reportedParticipant = room.participants.find(
            p => p.anonymousName === anonymousNameReported
        );

        if (!reportedParticipant) {
            return res.status(404).json({ message: 'User not found in room' });
        }

        // Prevent self-reporting
        if (reportedParticipant.userId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot report yourself' });
        }

        // Check for duplicate recent reports
        const existingReport = await Report.findOne({
            reportedUser: reportedParticipant.userId,
            reportedBy: req.user._id,
            room: roomId,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (existingReport) {
            return res.status(400).json({ message: 'You already reported this user recently' });
        }

        const report = await Report.create({
            reportedUser: reportedParticipant.userId,
            reportedBy: req.user._id,
            room: roomId,
            anonymousNameReported,
            reason,
            description
        });

        // Increment report count for user
        await User.findByIdAndUpdate(reportedParticipant.userId, {
            $inc: { reportCount: 1 }
        });

        // Auto-block if too many reports
        const user = await User.findById(reportedParticipant.userId);
        if (user && user.reportCount >= 5) {
            user.isBlocked = true;
            await user.save();
        }

        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Error creating report' });
    }
};

module.exports = { createReport };
