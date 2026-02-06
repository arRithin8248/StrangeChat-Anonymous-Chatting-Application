const express = require('express');
const router = express.Router();
const {
    createRoom,
    getRooms,
    getAvailableRooms,
    joinRoom,
    leaveRoom,
    getRoom,
    deleteRoom
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getRooms)
    .post(createRoom);

router.get('/available', getAvailableRooms);

router.route('/:id')
    .get(getRoom)
    .delete(deleteRoom);

router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);

module.exports = router;
