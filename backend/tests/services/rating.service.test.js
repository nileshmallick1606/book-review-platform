const ratingService = require('../../src/services/rating.service');
const BookModel = require('../../src/models/book.model');
const ReviewModel = require('../../src/models/review.model');
const { seedTestData } = require('../fixtures/seedTestData');

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

  describe('updateBookRating integration', () => {
    beforeEach(async () => {
      await seedTestData();
    });

    test('should update book rating when a new review is added', async () => {
      const bookId = 'book1';
      const initialBook = await BookModel.findById(bookId);
      
      // Initial state - no reviews
      expect(initialBook.averageRating).toBe(0);
      expect(initialBook.reviewCount).toBe(0);
      
      // Add a review
      const review = {
        id: 'review1',
        bookId: bookId,
        userId: 'user1',
        rating: 4,
        text: 'Great book!',
        timestamp: new Date().toISOString()
      };
      
      await ReviewModel.create(review);
      await ratingService.updateBookRating(bookId);
      
      // Check updated rating
      const updatedBook = await BookModel.findById(bookId);
      expect(updatedBook.averageRating).toBe(4);
      expect(updatedBook.reviewCount).toBe(1);
      
      // Add another review
      const review2 = {
        id: 'review2',
        bookId: bookId,
        userId: 'user2',
        rating: 2,
        text: 'Not as good as expected',
        timestamp: new Date().toISOString()
      };
      
      await ReviewModel.create(review2);
      await ratingService.updateBookRating(bookId);
      
      // Check updated rating again
      const finalBook = await BookModel.findById(bookId);
      expect(finalBook.averageRating).toBe(3);
      expect(finalBook.reviewCount).toBe(2);
    });

    test('should handle review updates correctly', async () => {
      const bookId = 'book1';
      
      // Add initial review
      const review = {
        id: 'review1',
        bookId: bookId,
        userId: 'user1',
        rating: 3,
        text: 'Decent book',
        timestamp: new Date().toISOString()
      };
      
      await ReviewModel.create(review);
      await ratingService.updateBookRating(bookId);
      
      // Update the review
      await ReviewModel.update('review1', {
        rating: 5,
        text: 'Actually, it was amazing!'
      });
      
      await ratingService.updateBookRating(bookId);
      
      // Check updated rating
      const updatedBook = await BookModel.findById(bookId);
      expect(updatedBook.averageRating).toBe(5);
      expect(updatedBook.reviewCount).toBe(1);
    });

    test('should handle review deletion correctly', async () => {
      const bookId = 'book1';
      
      // Add initial reviews
      const review1 = {
        id: 'review1',
        bookId: bookId,
        userId: 'user1',
        rating: 5,
        text: 'Excellent book',
        timestamp: new Date().toISOString()
      };
      
      const review2 = {
        id: 'review2',
        bookId: bookId,
        userId: 'user2',
        rating: 3,
        text: 'Good book',
        timestamp: new Date().toISOString()
      };
      
      await ReviewModel.create(review1);
      await ReviewModel.create(review2);
      await ratingService.updateBookRating(bookId);
      
      // Delete one review
      await ReviewModel.delete('review1');
      await ratingService.updateBookRating(bookId);
      
      // Check updated rating
      const updatedBook = await BookModel.findById(bookId);
      expect(updatedBook.averageRating).toBe(3);
      expect(updatedBook.reviewCount).toBe(1);
      
      // Delete the last review
      await ReviewModel.delete('review2');
      await ratingService.updateBookRating(bookId);
      
      // Check final rating - should reset to default values
      const finalBook = await BookModel.findById(bookId);
      expect(finalBook.averageRating).toBe(0);
      expect(finalBook.reviewCount).toBe(0);
    });

    test('should handle edge case with no reviews', async () => {
      const bookId = 'book2';
      
      // Book starts with no reviews
      const initialBook = await BookModel.findById(bookId);
      expect(initialBook.averageRating).toBe(0);
      expect(initialBook.reviewCount).toBe(0);
      
      // Update rating without any reviews
      await ratingService.updateBookRating(bookId);
      
      // Rating should remain unchanged
      const finalBook = await BookModel.findById(bookId);
      expect(finalBook.averageRating).toBe(0);
      expect(finalBook.reviewCount).toBe(0);
    });
  });
});
