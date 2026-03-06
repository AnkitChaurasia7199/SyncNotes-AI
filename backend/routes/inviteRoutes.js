const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const inviteController = require('../controllers/inviteController');

// Public route - validate invite code
router.post('/validate', inviteController.validateInviteCode);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('ADMIN'));

router.post('/generate', inviteController.generateInviteCode);
router.get('/', inviteController.getInviteCodes);
router.put('/:code/deactivate', inviteController.deactivateInviteCode);

module.exports = router;