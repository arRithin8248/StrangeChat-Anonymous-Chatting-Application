const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Report = require('../models/Report');

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Admin/Moderator
 */
const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalRooms,
            totalMessages,
            pendingReports,
            blockedUsers
        ] = await Promise.all([
            User.countDocuments(),
            Room.countDocuments(),
            Message.countDocuments(),
            Report.countDocuments({ status: 'pending' }),
            User.countDocuments({ isBlocked: true })
        ]);

        // Recent activity (last 24 hours)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [newUsers, newMessages] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: last24Hours } }),
            Message.countDocuments({ createdAt: { $gte: last24Hours } })
        ]);

        res.json({
            totalUsers,
            totalRooms,
            totalMessages,
            pendingReports,
            blockedUsers,
            last24Hours: {
                newUsers,
                newMessages
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

/**
 * @desc    Get all reports
 * @route   GET /api/admin/reports
 * @access  Admin/Moderator
 */
const getReports = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;

        const query = status !== 'all' ? { status } : {};

        const reports = await Report.find(query)
            .populate('reportedBy', 'username')
            .populate('room', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(query);

        res.json({
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

/**
 * @desc    Update report status
 * @route   PUT /api/admin/reports/:id
 * @access  Admin/Moderator
 */
const updateReport = async (req, res) => {
    try {
        const { status, action } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status || report.status;
        report.action = action || report.action;
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        // Apply action to reported user
        if (action === 'ban') {
            await User.findByIdAndUpdate(report.reportedUser, { isBlocked: true });
        } else if (action === 'warning') {
            await User.findByIdAndUpdate(report.reportedUser, {
                $inc: { reportCount: 1 }
            });

            // Auto-ban after 5 warnings
            const user = await User.findById(report.reportedUser);
            if (user && user.reportCount >= 5) {
                user.isBlocked = true;
                await user.save();
            }
        }

        await report.save();
        res.json(report);
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ message: 'Error updating report' });
    }
};

/**
 * @desc    Get all users (for management)
 * @route   GET /api/admin/users
 * @access  Admin
 */
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, blocked } = req.query;

        const query = blocked === 'true' ? { isBlocked: true } : {};

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

/**
 * @desc    Ban/Unban user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Admin
 */
const toggleBanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent banning admins
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot ban admin users' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            message: user.isBlocked ? 'User banned' : 'User unbanned',
            user: {
                _id: user._id,
                username: user.username,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        console.error('Toggle ban error:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

/**
 * @desc    Delete room (admin)
 * @route   DELETE /api/admin/rooms/:id
 * @access  Admin
 */
const adminDeleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        await Room.findByIdAndDelete(req.params.id);
        await Message.deleteMany({ room: req.params.id });

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Admin delete room error:', error);
        res.status(500).json({ message: 'Error deleting room' });
    }
};

/**
 * @desc    Get all rooms (admin)
 * @route   GET /api/admin/rooms
 * @access  Admin
 */
const getAllRooms = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const rooms = await Room.find()
            .select('name type participants createdAt expiresAt lastActivity')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const roomsWithCount = rooms.map(room => ({
            ...room.toObject(),
            participantCount: room.participants.length
        }));

        const total = await Room.countDocuments();

        res.json({
            rooms: roomsWithCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all rooms error:', error);
        res.status(500).json({ message: 'Error fetching rooms' });
    }
};

module.exports = {
    getStats,
    getReports,
    updateReport,
    getUsers,
    toggleBanUser,
    adminDeleteRoom,
    getAllRooms
};
