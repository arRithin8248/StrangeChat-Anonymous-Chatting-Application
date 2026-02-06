const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
    deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimit');

// All routes are protected
router.use(protect);

router.route('/:roomId')
    .get(getMessages)
    .post(messageLimiter, sendMessage);

router.delete('/:messageId', deleteMessage);

module.exports = router;
