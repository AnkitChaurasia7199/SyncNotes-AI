const mongoose = require('mongoose');

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 days from now
  },
  maxUses: {
    type: Number,
    default: 10
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique invite code
inviteCodeSchema.statics.generateCode = function() {
  return 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

module.exports = mongoose.model('InviteCode', inviteCodeSchema);