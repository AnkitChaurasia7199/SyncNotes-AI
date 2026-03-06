const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MEMBER'],
    default: 'MEMBER'
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Workspace ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// SINGLE pre-save middleware - ONLY ONE
userSchema.pre('save', async function(next) {
  try {
    // Only hash if password is modified
    if (!this.isModified('password')) {
      return next();
    }
    
    console.log('Hashing password for user:', this.email);
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Replace plain password with hashed password
    this.password = hashedPassword;
    
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error in password hashing:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;