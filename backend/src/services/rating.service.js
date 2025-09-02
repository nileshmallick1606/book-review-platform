/**
 * Rating Service
 * 
 * Provides calculation and validation functions for book ratings
 */

/**
 * Calculate average rating from an array of reviews
 * 
 * @param {Array} reviews - Array of review objects with rating property
 * @returns {Object} Object containing average rating rounded to 1 decimal and review count
 */
const calculateAverageRating = (reviews = []) => {
  try {
    if (!Array.isArray(reviews)) {
      throw new Error('Reviews must be an array');
    }
    
    const reviewCount = reviews.length;
    
    // Handle edge case: no reviews
    if (reviewCount === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }
    
    // Calculate average, filtering out invalid ratings
    const validReviews = reviews.filter(review => 
      review && 
      typeof review.rating === 'number' && 
      !isNaN(review.rating) &&
      review.rating >= 1 && 
      review.rating <= 5
    );
    
    // Handle edge case: no valid ratings
    if (validReviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }
    
    const sum = validReviews.reduce((total, review) => total + review.rating, 0);
    const average = sum / validReviews.length;
    
    // Round to 1 decimal place
    const roundedAverage = Math.round(average * 10) / 10;
    
    return {
      averageRating: roundedAverage,
      reviewCount: reviewCount
    };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    // Return safe defaults in case of error
    return { averageRating: 0, reviewCount: 0 };
  }
};

/**
 * Validate a rating value
 * 
 * @param {number} rating - Rating value to validate
 * @returns {boolean} Whether rating is valid
 */
const isValidRating = (rating) => {
  return (
    typeof rating === 'number' && 
    !isNaN(rating) && 
    rating >= 1 && 
    rating <= 5
  );
};

module.exports = {
  calculateAverageRating,
  isValidRating
};
