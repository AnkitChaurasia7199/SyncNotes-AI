const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const noteController = require('../controllers/noteController');

console.log('Note Controller:', Object.keys(noteController));

router.use(protect);

router.route('/')
  .get(noteController.getNotes)
  .post(noteController.createNote);

router.route('/:id')
  .get(noteController.getNote)
  .put(noteController.updateNote)
  .delete(noteController.deleteNote);

router.post('/:id/regenerate', noteController.regenerateAISummary);

module.exports = router;