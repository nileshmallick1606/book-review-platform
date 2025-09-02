const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected route
router.get('/', authMiddleware.authenticate, recommendationController.getRecommendations);

module.exports = router;
