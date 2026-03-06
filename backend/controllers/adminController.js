const User = require('../models/User');
const Note = require('../models/Note');
const Workspace = require('../models/Workspace');

// @desc    Get all users in workspace
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    console.log('Admin fetching users for workspace:', req.user.workspaceId);
    
    const users = await User.find({ workspaceId: req.user.workspaceId })
      .select('-password')
      .sort('-createdAt');

    // Get note counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const noteCount = await Note.countDocuments({ 
          createdBy: user._id,
          workspaceId: req.user.workspaceId 
        });
        
        return {
          ...user.toObject(),
          noteCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workspace stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getWorkspaceStats = async (req, res, next) => {
  try {
    const workspaceId = req.user.workspaceId;
    
    const [totalUsers, totalNotes, workspace] = await Promise.all([
      User.countDocuments({ workspaceId }),
      Note.countDocuments({ workspaceId }),
      Workspace.findById(workspaceId)
    ]);

    const notesByUser = await Note.aggregate([
      { $match: { workspaceId: workspaceId } },
      { $group: { 
          _id: '$createdBy', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        workspace: workspace?.name,
        totalUsers,
        totalNotes,
        topContributors: notesByUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Can't delete yourself
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findOne({ 
      _id: userId, 
      workspaceId: req.user.workspaceId 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's notes first
    await Note.deleteMany({ 
      createdBy: userId,
      workspaceId: req.user.workspaceId 
    });

    // Delete user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User and their notes deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};