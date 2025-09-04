const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const reviewController = require('../controllers/review.controller');

// Protected routes - require authentication for all routes
router.use(authMiddleware.authenticate);

// Favorites routes for current user (these need to come BEFORE /:id routes)
router.get('/favorites', userController.getUserFavorites);  // Get current user's favorites
router.post('/favorites/:bookId', userController.addFavoriteBook);
router.delete('/favorites/:bookId', userController.removeFavoriteBook);

// User profile routes
router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.get('/:id/reviews', reviewController.getUserReviews);
router.get('/:id/favorites', userController.getFavoriteBooks);  // Get a specific user's favorites

module.exports = router;
