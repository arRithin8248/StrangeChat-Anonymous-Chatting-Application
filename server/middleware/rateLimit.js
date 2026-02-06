const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Auth routes rate limiter (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: {
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Message rate limiter (per user)
const messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit to 60 messages per minute
    message: {
        message: 'Message rate limit exceeded. Please slow down.'
    },
    keyGenerator: (req) => {
        // Use user ID if available, otherwise IP
        return req.user ? req.user._id.toString() : req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Socket message rate tracking (in-memory)
const socketMessageTracker = new Map();

const checkSocketRateLimit = (userId) => {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxMessages = 60;

    if (!socketMessageTracker.has(userId)) {
        socketMessageTracker.set(userId, []);
    }

    const userMessages = socketMessageTracker.get(userId);

    // Remove old messages outside the window
    const recentMessages = userMessages.filter(timestamp => now - timestamp < windowMs);
    socketMessageTracker.set(userId, recentMessages);

    if (recentMessages.length >= maxMessages) {
        return false; // Rate limit exceeded
    }

    // Add current message timestamp
    recentMessages.push(now);
    socketMessageTracker.set(userId, recentMessages);

    return true; // Within rate limit
};

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    const windowMs = 60 * 1000;

    for (const [userId, messages] of socketMessageTracker.entries()) {
        const recentMessages = messages.filter(timestamp => now - timestamp < windowMs);
        if (recentMessages.length === 0) {
            socketMessageTracker.delete(userId);
        } else {
            socketMessageTracker.set(userId, recentMessages);
        }
    }
}, 60 * 1000); // Clean up every minute

module.exports = {
    apiLimiter,
    authLimiter,
    messageLimiter,
    checkSocketRateLimit
};
