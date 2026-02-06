const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    anonymousName: {
        type: String,
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: [50, 'Room name cannot exceed 50 characters']
    },
    type: {
        type: String,
        enum: ['one-to-one', 'group'],
        default: 'group'
    },
    participants: [participantSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isTemporary: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    maxParticipants: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});

// TTL index for auto-deletion of expired rooms
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster queries
roomSchema.index({ 'participants.userId': 1 });

// Update lastActivity on save
roomSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    next();
});

// Get participant's anonymous name
roomSchema.methods.getAnonymousName = function (userId) {
    const participant = this.participants.find(p => p.userId.toString() === userId.toString());
    return participant ? participant.anonymousName : null;
};

module.exports = mongoose.model('Room', roomSchema);
