const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const reviewController = require('../controllers/review.controller');

// Public routes
router.get('/:id', userController.getUserProfile);
router.get('/:id/favorites', userController.getFavoriteBooks);
router.get('/:id/reviews', reviewController.getUserReviews);

// Protected routes
router.use(authMiddleware.authenticate);
router.put('/:id', userController.updateUserProfile);
router.post('/favorites/:bookId', userController.addFavoriteBook);
router.delete('/favorites/:bookId', userController.removeFavoriteBook);

module.exports = router;
