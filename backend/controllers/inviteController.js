const InviteCode = require('../models/InviteCode');
const User = require('../models/User');
const Workspace = require('../models/Workspace');

// @desc    Generate new invite code
// @route   POST /api/invites/generate
// @access  Private/Admin
exports.generateInviteCode = async (req, res) => {
  try {
    // Only admin can generate codes
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can generate invite codes'
      });
    }

    const { maxUses, expiresInDays } = req.body;

    // Generate unique code
    const code = InviteCode.generateCode();

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7));

    // Create invite code
    const inviteCode = await InviteCode.create({
      code,
      workspaceId: req.user.workspaceId,
      createdBy: req.user.userId,
      maxUses: maxUses || 10,
      expiresAt,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        maxUses: inviteCode.maxUses,
        inviteUrl: `http://localhost:3000/register?code=${inviteCode.code}`
      },
      message: 'Invite code generated successfully'
    });

  } catch (error) {
    console.error('Generate invite code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate invite code'
    });
  }
};

// @desc    Get all invite codes for workspace
// @route   GET /api/invites
// @access  Private/Admin
exports.getInviteCodes = async (req, res) => {
  try {
    const inviteCodes = await InviteCode.find({ 
      workspaceId: req.user.workspaceId 
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: inviteCodes.length,
      data: inviteCodes
    });

  } catch (error) {
    console.error('Get invite codes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invite codes'
    });
  }
};

// @desc    Validate invite code
// @route   POST /api/invites/validate
// @access  Public
exports.validateInviteCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    // Find invite code
    const inviteCode = await InviteCode.findOne({ code });

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if active
    if (!inviteCode.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is deactivated'
      });
    }

    // Check expiry
    if (inviteCode.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invite code has expired'
      });
    }

    // Check usage limit
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Invite code has reached maximum usage'
      });
    }

    // Get workspace info
    const workspace = await Workspace.findById(inviteCode.workspaceId);

    res.status(200).json({
      success: true,
      data: {
        code: inviteCode.code,
        workspaceId: inviteCode.workspaceId,
        workspaceName: workspace?.name,
        valid: true
      },
      message: 'Valid invite code'
    });

  } catch (error) {
    console.error('Validate invite code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate invite code'
    });
  }
};

// @desc    Use invite code (increment count)
// @route   POST /api/invites/use
// @access  Private (called during registration)
exports.useInviteCode = async (code) => {
  try {
    const inviteCode = await InviteCode.findOne({ code });
    
    if (!inviteCode) {
      throw new Error('Invalid invite code');
    }

    inviteCode.usedCount += 1;
    await inviteCode.save();

    return inviteCode.workspaceId;
  } catch (error) {
    throw error;
  }
};

// @desc    Deactivate invite code
// @route   PUT /api/invites/:code/deactivate
// @access  Private/Admin
exports.deactivateInviteCode = async (req, res) => {
  try {
    const { code } = req.params;

    const inviteCode = await InviteCode.findOne({ 
      code,
      workspaceId: req.user.workspaceId 
    });

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: 'Invite code not found'
      });
    }

    inviteCode.isActive = false;
    await inviteCode.save();

    res.status(200).json({
      success: true,
      message: 'Invite code deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate invite code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate invite code'
    });
  }
};