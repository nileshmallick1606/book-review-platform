/**
 * Rating utility functions
 */

/**
 * Calculate distribution of ratings from an array of reviews
 * 
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Distribution of ratings (counts for each star rating 1-5)
 */
const calculateRatingDistribution = (reviews = []) => {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return distribution;
  }

  // Count reviews for each star rating
  reviews.forEach(review => {
    if (review && typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5) {
      // Round to nearest integer for distribution
      const ratingKey = Math.round(review.rating);
      distribution[ratingKey] = (distribution[ratingKey] || 0) + 1;
    }
  });

  return distribution;
};

/**
 * Get percentage of positive ratings (4-5 stars)
 * 
 * @param {Object} distribution - Distribution of ratings
 * @returns {number} Percentage of positive ratings (0-100)
 */
const getPositiveRatingPercentage = (distribution) => {
  const totalRatings = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  if (totalRatings === 0) return 0;
  
  const positiveRatings = (distribution[4] || 0) + (distribution[5] || 0);
  return Math.round((positiveRatings / totalRatings) * 100);
};

module.exports = {
  calculateRatingDistribution,
  getPositiveRatingPercentage
};
