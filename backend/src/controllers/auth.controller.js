const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email, password, and name are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Create new user
    const user = await userModel.create({ email, password, name });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await userModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    // Check if req.user exists first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // User ID comes from the JWT token validation middleware
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    
    // Find user by ID
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    // Return the user profile wrapped in a 'user' object to match test expectations
    res.status(200).json({
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
