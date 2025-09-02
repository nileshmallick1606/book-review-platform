const ratingService = require('../../src/services/rating.service');

describe('Rating Service', () => {
  describe('calculateAverageRating', () => {
    test('calculates average rating correctly', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 }
      ];
      
      const result = ratingService.calculateAverageRating(reviews);
      expect(result.averageRating).toBe(3);
      expect(result.reviewCount).toBe(5);
    });
    
    test('rounds to 1 decimal place', () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 1 }
      ];
      
      const result = ratingService.calculateAverageRating(reviews);
      expect(result.averageRating).toBe(4);
      expect(result.reviewCount).toBe(4);
      
      const reviews2 = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 1 }
      ];
      
      const result2 = ratingService.calculateAverageRating(reviews2);
      expect(result2.averageRating).toBe(3.8);
      expect(result2.reviewCount).toBe(4);
    });
    
    test('handles empty reviews array', () => {
      const reviews = [];
      
      const result = ratingService.calculateAverageRating(reviews);
      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
    
    test('handles undefined input', () => {
      const result = ratingService.calculateAverageRating();
      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
    
    test('filters invalid ratings', () => {
      const reviews = [
        { rating: 5 },
        { rating: 0 }, // Invalid - below 1
        { rating: 6 }, // Invalid - above 5
        { rating: 'abc' }, // Invalid - not a number
        { rating: 3 },
        { something: 'else' } // Missing rating
      ];
      
      const result = ratingService.calculateAverageRating(reviews);
      expect(result.averageRating).toBe(4); // Average of 5 and 3
      expect(result.reviewCount).toBe(6); // Total count includes all reviews
    });
  });
  
  describe('isValidRating', () => {
    test('validates rating correctly', () => {
      expect(ratingService.isValidRating(1)).toBe(true);
      expect(ratingService.isValidRating(2)).toBe(true);
      expect(ratingService.isValidRating(3)).toBe(true);
      expect(ratingService.isValidRating(4)).toBe(true);
      expect(ratingService.isValidRating(5)).toBe(true);
      
      expect(ratingService.isValidRating(0)).toBe(false);
      expect(ratingService.isValidRating(6)).toBe(false);
      expect(ratingService.isValidRating(-1)).toBe(false);
      expect(ratingService.isValidRating('3')).toBe(false);
      expect(ratingService.isValidRating(null)).toBe(false);
      expect(ratingService.isValidRating(undefined)).toBe(false);
      expect(ratingService.isValidRating(NaN)).toBe(false);
    });
  });
});
