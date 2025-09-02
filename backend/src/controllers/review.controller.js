const reviewModel = require('../models/review.model');
const bookModel = require('../models/book.model');

// Get reviews for a book
const getBookReviews = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const { page, limit, sortBy, sortOrder } = req.query;
    
    // Parse pagination and sorting options
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sortBy: sortBy || 'timestamp',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await reviewModel.findByBookIdWithUserInfo(bookId, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Create a review for a book
const createReview = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user.id;
    const { text, rating } = req.body;
    
    // Validate required fields
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Review text is required' });
    }
    
    // Validate rating
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Check if book exists
    const book = await bookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if user has already reviewed this book
    const hasReviewed = await reviewModel.userHasReviewed(userId, bookId);
    if (hasReviewed) {
      return res.status(409).json({ message: 'You have already reviewed this book' });
    }
    
    // Create review
    const review = await reviewModel.create({
      bookId,
      userId,
      text,
      rating: ratingNum
    });
    
    // Update book rating
    await bookModel.updateBookRatings(bookId);
    
    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// Update a review
const updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const { text, rating } = req.body;
    
    // Validate required fields
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Review text is required' });
    }
    
    // Validate rating
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find the review
    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }
    
    // Update review
    const updatedReview = await reviewModel.update(reviewId, {
      text,
      rating: ratingNum
    });
    
    // Update book rating
    await bookModel.updateBookRatings(review.bookId);
    
    res.status(200).json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review
const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    
    // Find the review
    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }
    
    // Store bookId before deletion to update ratings
    const bookId = review.bookId;
    
    // Delete the review
    const deleted = await reviewModel.delete(reviewId);
    
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete review' });
    }
    
    // Update book rating
    await bookModel.updateBookRatings(bookId);
    
    res.status(200).json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by user with book details
const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { page, limit, sortBy, sortOrder } = req.query;
    
    // Parse pagination and sorting options
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sortBy: sortBy || 'timestamp',
      sortOrder: sortOrder || 'desc'
    };
    
    // Use the enhanced method that includes book information
    const result = await reviewModel.findByUserIdWithBookInfo(userId, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews
};
