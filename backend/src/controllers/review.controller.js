const reviewModel = require('../models/review.model');
const bookModel = require('../models/book.model');

// Get reviews for a book
const getBookReviews = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    
    const reviews = await reviewModel.findByBookId(bookId);
    
    res.status(200).json({ reviews });
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
    
    // Validate rating
    if (rating < 1 || rating > 5) {
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
      rating
    });
    
    // Update book rating (in real implementation)
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
    
    // Validate rating
    if (rating < 1 || rating > 5) {
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
      rating
    });
    
    // Update book rating (in real implementation)
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
    
    // Delete the review
    await reviewModel.delete(reviewId);
    
    // Update book rating (in real implementation)
    await bookModel.updateBookRatings(review.bookId);
    
    res.status(200).json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by user
const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const reviews = await reviewModel.findByUserId(userId);
    
    res.status(200).json({ reviews });
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
