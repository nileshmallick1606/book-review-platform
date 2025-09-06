/**
 * Recommendation Controller
 * 
 * Handles API endpoints related to book recommendations
 */

const recommendationService = require('../services/recommendation.service');

/**
 * Get personalized book recommendations for the authenticated user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Extract query parameters
    const { limit = 5, genre = null, refresh = true } = req.query;
    
    // Get recommendations
    let recommendations = await recommendationService.getRecommendationsForUser(
      userId, 
      {
        limit: parseInt(limit),
        genre,
        forceRefresh: refresh === 'true'
      }
    );
    
    // If no personalized recommendations, get default recommendations
    if (!recommendations || recommendations.length === 0) {
      recommendations = await recommendationService.getDefaultRecommendations(
        parseInt(limit), 
        genre
      );
    }
    
    // Return recommendations in the format expected by tests
    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations
};
