const ratingUtils = require('../../src/utils/rating.utils');

describe('Rating Utils', () => {
  describe('calculateRatingDistribution', () => {
    test('calculates distribution correctly', () => {
      const reviews = [
        { rating: 1 },
        { rating: 1 },
        { rating: 2 },
        { rating: 3 },
        { rating: 4 },
        { rating: 4 },
        { rating: 5 },
        { rating: 5 },
        { rating: 5 }
      ];
      
      const distribution = ratingUtils.calculateRatingDistribution(reviews);
      
      expect(distribution).toEqual({
        1: 2,
        2: 1,
        3: 1,
        4: 2,
        5: 3
      });
    });
    
    test('handles empty reviews array', () => {
      const distribution = ratingUtils.calculateRatingDistribution([]);
      
      expect(distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
    });
    
    test('handles undefined input', () => {
      const distribution = ratingUtils.calculateRatingDistribution();
      
      expect(distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
    });
    
    test('rounds decimal ratings to nearest integer', () => {
      const reviews = [
        { rating: 1.2 },  // Rounds to 1
        { rating: 2.7 },  // Rounds to 3
        { rating: 3.4 },  // Rounds to 3
        { rating: 3.6 },  // Rounds to 4
        { rating: 4.9 }   // Rounds to 5
      ];
      
      const distribution = ratingUtils.calculateRatingDistribution(reviews);
      
      expect(distribution).toEqual({
        1: 1,
        2: 0,
        3: 2,
        4: 1,
        5: 1
      });
    });
  });
  
  describe('getPositiveRatingPercentage', () => {
    test('calculates positive percentage correctly', () => {
      const distribution = {
        1: 5,
        2: 5,
        3: 10,
        4: 15,
        5: 15
      };
      
      // 15 + 15 = 30 positive out of 50 total = 60%
      const percentage = ratingUtils.getPositiveRatingPercentage(distribution);
      expect(percentage).toBe(60);
    });
    
    test('handles empty distribution', () => {
      const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
      
      const percentage = ratingUtils.getPositiveRatingPercentage(distribution);
      expect(percentage).toBe(0);
    });
    
    test('handles all positive ratings', () => {
      const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 10,
        5: 10
      };
      
      const percentage = ratingUtils.getPositiveRatingPercentage(distribution);
      expect(percentage).toBe(100);
    });
    
    test('handles all negative ratings', () => {
      const distribution = {
        1: 10,
        2: 10,
        3: 10,
        4: 0,
        5: 0
      };
      
      const percentage = ratingUtils.getPositiveRatingPercentage(distribution);
      expect(percentage).toBe(0);
    });
  });
});
