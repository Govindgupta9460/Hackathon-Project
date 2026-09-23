const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate 7-day JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to return user object without password
const sanitizeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    createdAt: user.createdAt
  };
};

// @desc    Register a new user (Student or Organizer)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Role validation: default to 'student', allow 'organizer'
    let assignedRole = 'student';
    if (role) {
      if (!['student', 'organizer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Role must be 'student' or 'organizer'" });
      }
      assignedRole = role;
    }

    // Create user (password is hashed by pre-save hook in User model)
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      department: department || ''
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated)
const getMe = async (req, res) => {
  try {
    // req.user is attached by authMiddleware
    return res.status(200).json({
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
