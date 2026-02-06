const express = require('express');
const router = express.Router();
const {
    getStats,
    getReports,
    updateReport,
    getUsers,
    toggleBanUser,
    adminDeleteRoom,
    getAllRooms
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin, isModerator } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

// Stats (moderator+)
router.get('/stats', isModerator, getStats);

// Reports (moderator+)
router.route('/reports')
    .get(isModerator, getReports);

router.put('/reports/:id', isModerator, updateReport);

// Users (admin only)
router.get('/users', isAdmin, getUsers);
router.put('/users/:id/ban', isAdmin, toggleBanUser);

// Rooms (admin only)
router.get('/rooms', isAdmin, getAllRooms);
router.delete('/rooms/:id', isAdmin, adminDeleteRoom);

module.exports = router;
