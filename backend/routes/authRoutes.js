const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.get('/invite-code', protect, authorize('ADMIN'), authController.getInviteCode);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth route working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;