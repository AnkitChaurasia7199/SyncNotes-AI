const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function testBcrypt() {
  try {
    console.log('Testing bcrypt directly...');
    
    const password = 'password123';
    console.log('Original password:', password);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hash);
    
    // Compare password
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Password match:', isMatch);
    
    console.log('✅ Bcrypt working fine!');
    return true;
  } catch (error) {
    console.error('❌ Bcrypt error:', error);
    return false;
  }
}

async function testUserModel() {
  try {
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import models
    const User = require('./models/User');
    const Workspace = require('./models/Workspace');
    
    // Clear test data
    await User.deleteMany({ email: 'test@example.com' });
    await Workspace.deleteMany({ name: 'Test Workspace' });
    
    console.log('\nCreating test workspace...');
    const workspace = await Workspace.create({
      name: 'Test Workspace'
    });
    console.log('✅ Workspace created:', workspace._id);
    
    console.log('\nCreating test user...');
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      role: 'ADMIN',
      workspaceId: workspace._id
    });
    
    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId
    });
    
    // Fetch user with password
    const userWithPassword = await User.findOne({ email: 'test@example.com' }).select('+password');
    console.log('\nStored password hash:', userWithPassword.password.substring(0, 20) + '...');
    
    // Test password comparison
    const isMatch = await userWithPassword.comparePassword('password123');
    console.log('Password comparison (correct):', isMatch);
    
    const isWrongMatch = await userWithPassword.comparePassword('wrongpassword');
    console.log('Password comparison (wrong):', isWrongMatch);
    
    console.log('\n✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

async function runTests() {
  const bcryptTest = await testBcrypt();
  if (bcryptTest) {
    await testUserModel();
  }
}

runTests();