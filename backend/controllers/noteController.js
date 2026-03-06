const Note = require('../models/Note');
const aiService = require('../services/aiService');

// @desc    Get all notes (ADMIN sees ALL, MEMBER sees only own)
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res, next) => {
  try {
    let notes;

    if (req.user.role === 'ADMIN') {
      // ✅ ADMIN sees ALL notes in workspace with user details
      console.log('👑 Admin fetching ALL notes in workspace:', req.user.workspaceId);
      
      notes = await Note.find({ workspaceId: req.user.workspaceId })
        .populate('createdBy', 'email role')
        .sort('-createdAt');
    } else {
      // 👤 MEMBER sees only their own notes
      console.log('👤 Member fetching their notes. User ID:', req.user.userId);
      
      notes = await Note.find({ 
        workspaceId: req.user.workspaceId,
        createdBy: req.user.userId 
      })
      .populate('createdBy', 'email role')
      .sort('-createdAt');
    }

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
      role: req.user.role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note (ADMIN can get ANY, MEMBER only own)
// @route   GET /api/notes/:id
// @access  Private
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('createdBy', 'email role');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check workspace isolation
    if (note.workspaceId.toString() !== req.user.workspaceId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this note'
      });
    }

    // ✅ MEMBER can only access their own notes
    // ✅ ADMIN can access ANY note in workspace
    if (req.user.role === 'MEMBER' && note.createdBy._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own notes'
      });
    }

    res.status(200).json({
      success: true,
      data: note,
      canEdit: req.user.role === 'ADMIN' || note.createdBy._id.toString() === req.user.userId.toString(),
      canDelete: req.user.role === 'ADMIN' || note.createdBy._id.toString() === req.user.userId.toString()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create note (Both Admin and Member can create)
// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content'
      });
    }

    // Create note
    const note = await Note.create({
      title,
      content,
      createdBy: req.user.userId,
      workspaceId: req.user.workspaceId,
      summary: '⏳ AI is processing...',
      keyPoints: []
    });

    // Send immediate response
    res.status(202).json({
      success: true,
      message: 'Note created. AI processing in background.',
      data: note,
      processing: true
    });

    // Process AI in background
    processAIContent(note._id, content).catch(err => {
      console.error('Background AI processing failed:', err);
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update note (ADMIN can update ANY, MEMBER only own)
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    
    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check workspace isolation
    if (note.workspaceId.toString() !== req.user.workspaceId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this note'
      });
    }

    // ✅ ADMIN can update ANY note
    // ✅ MEMBER can only update their own notes
    if (req.user.role === 'MEMBER' && note.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own notes'
      });
    }

    console.log(`📝 ${req.user.role} updating note:`, note._id);

    // Update note
    note = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title: title || note.title,
        content: content || note.content,
        updatedAt: Date.now(),
        aiProcessed: false // Reset AI status
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Process AI in background if content changed
    if (content && content !== note.content) {
      processAIContent(note._id, content).catch(err => {
        console.error('Background AI processing failed:', err);
      });
    }

    res.status(200).json({
      success: true,
      data: note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete note (ADMIN can delete ANY, MEMBER only own)
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check workspace isolation
    if (note.workspaceId.toString() !== req.user.workspaceId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this note'
      });
    }

    // ✅ ADMIN can delete ANY note
    // ✅ MEMBER can only delete their own notes
    if (req.user.role === 'MEMBER' && note.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notes'
      });
    }

    console.log(`🗑️ ${req.user.role} deleting note:`, note._id);

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate AI summary (ADMIN can regenerate ANY, MEMBER only own)
// @route   POST /api/notes/:id/regenerate
// @access  Private
exports.regenerateAISummary = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check workspace isolation
    if (note.workspaceId.toString() !== req.user.workspaceId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this note'
      });
    }

    // ✅ ADMIN can regenerate ANY note's AI
    // ✅ MEMBER can only regenerate their own notes
    if (req.user.role === 'MEMBER' && note.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only regenerate AI for your own notes'
      });
    }

    console.log(`🤖 ${req.user.role} regenerating AI for note:`, note._id);

    res.status(202).json({
      success: true,
      message: 'AI regeneration started'
    });

    // Process AI in background
    processAIContent(note._id, note.content).catch(err => {
      console.error('Background AI processing failed:', err);
    });

  } catch (error) {
    next(error);
  }
};

// Background AI processing function
async function processAIContent(noteId, content) {
  try {
    console.log(`🔍 Processing AI for note ${noteId}`);
    const aiResult = await aiService.generateSummary(content);
    
    await Note.findByIdAndUpdate(noteId, {
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      aiProcessed: true,
      updatedAt: Date.now()
    });
    
    console.log(`✅ AI processing completed for note ${noteId}`);
  } catch (error) {
    console.error(`❌ AI processing failed:`, error);
    await Note.findByIdAndUpdate(noteId, {
      summary: 'AI processing failed. Click regenerate to try again.',
      keyPoints: [],
      aiProcessed: false
    });
  }
}