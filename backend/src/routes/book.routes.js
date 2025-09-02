const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authMiddleware = require('../middleware/auth.middleware');
const reviewController = require('../controllers/review.controller');

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/search', bookController.searchBooks);
router.get('/:id', bookController.getBookById);
router.get('/:id/ratings', bookController.getBookRatings);

// Protected routes
router.post('/:id/recalculate-rating', authMiddleware.authenticate, bookController.recalculateBookRating);

// Book reviews
router.get('/:bookId/reviews', reviewController.getBookReviews);
router.post('/:bookId/reviews', authMiddleware.authenticate, reviewController.createReview);

module.exports = router;
