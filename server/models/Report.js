const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    anonymousNameReported: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: [true, 'Report reason is required'],
        enum: ['spam', 'harassment', 'inappropriate', 'threats', 'other']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    action: {
        type: String,
        enum: ['none', 'warning', 'mute', 'ban'],
        default: 'none'
    }
}, {
    timestamps: true
});

// Index for faster queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1 });

module.exports = mongoose.model('Report', reportSchema);
