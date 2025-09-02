const userModel = require('../models/user.model');
const reviewModel = require('../models/review.model');

// Get user profile with statistics
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user reviews count
    const reviews = await reviewModel.findAll();
    const userReviews = reviews.filter(review => review.userId === userId);
    const reviewCount = userReviews.length;
    
    // Remove sensitive information
    const { password, ...userProfile } = user;
    
    // Include statistics
    const profileWithStats = {
      ...userProfile,
      reviewCount
    };
    
    res.status(200).json({ user: profileWithStats });
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
    
    // Allow updating name and other profile fields
    // But prevent updating sensitive fields like email or password
    const { name, bio, location } = req.body;
    const updateData = {};
    
    // Only include fields that are provided
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    
    // Validate
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    const updatedUser = await userModel.updateProfile(userId, updateData);
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
    const userId = req.user.id;
    const bookId = req.params.bookId;
    
    // Check if book exists
    const bookModel = require('../models/book.model');
    const book = await bookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Add to favorites
    const updatedUser = await userModel.addFavoriteBook(userId, bookId);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Book added to favorites successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Remove a book from favorites
const removeFavoriteBook = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.bookId;
    
    // Remove from favorites
    const updatedUser = await userModel.removeFavoriteBook(userId, bookId);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or book not in favorites' });
    }
    
    res.status(200).json({
      message: 'Book removed from favorites successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get favorite books
const getFavoriteBooks = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Get user's favorite book IDs
    const favoriteIds = await userModel.getFavoriteBooks(userId);
    
    // Get book details for each favorite
    const bookModel = require('../models/book.model');
    const books = await bookModel.findAll();
    const favoriteBooks = books.filter(book => favoriteIds.includes(book.id));
    
    res.status(200).json({
      favorites: favoriteBooks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  addFavoriteBook,
  removeFavoriteBook,
  getFavoriteBooks
};
