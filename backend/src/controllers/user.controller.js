const userModel = require('../models/user.model');

// Get user profile
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive information
    const { password, ...userProfile } = user;
    
    res.status(200).json({ user: userProfile });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;
    
    // Check if user is updating their own profile
    if (userId !== currentUserId) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }
    
    const { name } = req.body;
    
    const updatedUser = await userModel.updateProfile(userId, { name });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive information
    const { password, ...userProfile } = updatedUser;
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
};

// Add a book to favorites
const addFavoriteBook = async (req, res, next) => {
  try {
    // For this simplified version, we'll just return a success message
    // In a complete implementation, we would update the user's favorites list
    res.status(200).json({
      message: 'Book added to favorites'
    });
  } catch (error) {
    next(error);
  }
};

// Remove a book from favorites
const removeFavoriteBook = async (req, res, next) => {
  try {
    // For this simplified version, we'll just return a success message
    // In a complete implementation, we would update the user's favorites list
    res.status(200).json({
      message: 'Book removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  addFavoriteBook,
  removeFavoriteBook
};
