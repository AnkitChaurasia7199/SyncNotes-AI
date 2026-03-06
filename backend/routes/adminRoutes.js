const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// User management
router.get('/users', adminController.getUsers);
router.delete('/users/:userId', adminController.deleteUser);

// Workspace stats
router.get('/stats', adminController.getWorkspaceStats);

module.exports = router;