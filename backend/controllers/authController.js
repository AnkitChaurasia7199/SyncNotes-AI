const User = require('../models/User');
const Workspace = require('../models/Workspace');
const InviteCode = require('../models/InviteCode');
const jwt = require('jsonwebtoken');

// @desc    Register user (with invite code support)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, workspaceName, inviteCode } = req.body;

    console.log('📝 Registration attempt:', { email, hasInviteCode: !!inviteCode });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if this is first user in entire system
    const anyUser = await User.findOne({});
    
    // CASE 1: FIRST USER EVER (ADMIN)
    if (!anyUser) {
      console.log('👑 First user - creating as ADMIN');
      
      // Create workspace
      const workspace = await Workspace.create({
        name: workspaceName || `${email.split('@')[0]}'s Workspace`
      });

      // Create admin user
      const user = await User.create({
        email,
        password,
        role: 'ADMIN',
        workspaceId: workspace._id
      });

      // Generate token
      const token = jwt.sign(
        { 
          userId: user._id, 
          role: user.role, 
          workspaceId: user.workspaceId 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Admin user created:', user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: workspace.name
        },
        message: 'Workspace created successfully! You are the admin.'
      });
    }

    // CASE 2: NOT FIRST USER - NEED INVITE CODE
    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required to register. Please contact an admin.'
      });
    }

    // Validate invite code
    console.log('🔑 Validating invite code:', inviteCode);
    
    const inviteCodeDoc = await InviteCode.findOne({ code: inviteCode });

    if (!inviteCodeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if active
    if (!inviteCodeDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This invite code has been deactivated'
      });
    }

    // Check expiry
    if (inviteCodeDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invite code has expired'
      });
    }

    // Check usage limit
    if (inviteCodeDoc.usedCount >= inviteCodeDoc.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'This invite code has reached maximum usage limit'
      });
    }

    // Get workspace from invite code
    const workspace = await Workspace.findById(inviteCodeDoc.workspaceId);
    
    if (!workspace) {
      return res.status(400).json({
        success: false,
        message: 'Workspace not found for this invite code'
      });
    }

    // Create member user
    const user = await User.create({
      email,
      password,
      role: 'MEMBER',
      workspaceId: workspace._id
    });

    // Increment invite code usage
    inviteCodeDoc.usedCount += 1;
    await inviteCodeDoc.save();

    console.log('✅ Member user created:', user._id);

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        workspaceId: user.workspaceId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: workspace.name
      },
      message: 'Successfully joined the workspace! You are a member.'
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get workspace info
    const workspace = await Workspace.findById(user.workspaceId);

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        workspaceId: user.workspaceId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', { email, role: user.role });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: workspace?.name || 'Workspace'
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed. Please try again.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    const workspace = await Workspace.findById(user.workspaceId);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: workspace?.name,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
};

// Add this function at the end of your authController.js (before module.exports)

// @desc    Get invite code for workspace (Admin only)
// @route   GET /api/auth/invite-code
// @access  Private/Admin
exports.getInviteCode = async (req, res) => {
  try {
    // Only admin can get invite code
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access invite codes'
      });
    }

    // For simplicity, return workspace ID as invite code
    // In production, you'd generate proper codes
    res.status(200).json({
      success: true,
      inviteCode: req.user.workspaceId,
      message: 'Share this code with users to join your workspace'
    });

  } catch (error) {
    console.error('Get invite code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get invite code'
    });
  }
};