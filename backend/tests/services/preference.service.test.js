/**
 * Tests for Preference Service
 */

const preferenceService = require('../../src/services/preference.service');
const UserModel = require('../../src/models/user.model');
const ReviewModel = require('../../src/models/review.model');
const BookModel = require('../../src/models/book.model');

// Mock the models
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/review.model');
jest.mock('../../src/models/book.model');

describe('Preference Service', () => {
  // Test data
  const testUserId = 'user-123';
  const testUser = {
    id: testUserId,
    name: 'Test User',
    email: 'test@example.com',
    favorites: ['book-1', 'book-3']
  };
  
  const testReviews = [
    { id: 'rev-1', userId: testUserId, bookId: 'book-1', rating: 5, text: 'Loved it!' },
    { id: 'rev-2', userId: testUserId, bookId: 'book-2', rating: 4, text: 'Pretty good' },
    { id: 'rev-3', userId: testUserId, bookId: 'book-4', rating: 2, text: 'Not great' }
  ];
  
  const testBooks = [
    { id: 'book-1', title: 'Fantasy Book', author: 'Author A', genres: ['Fantasy', 'Adventure'], publishedYear: 2010 },
    { id: 'book-2', title: 'Sci-Fi Book', author: 'Author B', genres: ['Science Fiction'], publishedYear: 2018 },
    { id: 'book-3', title: 'Mystery Book', author: 'Author A', genres: ['Mystery', 'Thriller'], publishedYear: 1995 },
    { id: 'book-4', title: 'Romance Novel', author: 'Author C', genres: ['Romance'], publishedYear: 2005 }
  ];
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    UserModel.mockImplementation(() => ({
      findById: jest.fn().mockResolvedValue(testUser)
    }));
    
    ReviewModel.mockImplementation(() => ({
      findByUserId: jest.fn().mockResolvedValue(testReviews)
    }));
    
    // Create a mock for BookModel that returns different books based on ID
    BookModel.mockImplementation(() => ({
      findById: jest.fn().mockImplementation(id => {
        return Promise.resolve(testBooks.find(book => book.id === id) || null);
      })
    }));
    
    // Override some internal methods in the preference service
    preferenceService._findBookInArray = jest.fn((id, books) => {
      return testBooks.find(book => book.id === id) || null;
    });
    preferenceService.allBooks = testBooks;
  });
  
  describe('getUserPreferences', () => {
    it('should return a comprehensive preference profile', async () => {
      const preferences = await preferenceService.getUserPreferences(testUserId);
      
      // Verify the structure of the preferences object
      expect(preferences).toHaveProperty('genres');
      expect(preferences).toHaveProperty('authors');
      expect(preferences).toHaveProperty('ratingPattern');
      expect(preferences).toHaveProperty('favoriteThemes');
      expect(preferences).toHaveProperty('publicationEra');
      
      // Verify user model was called
      expect(preferenceService.userModel.findById).toHaveBeenCalledWith(testUserId);
      
      // Verify review model was called
      expect(preferenceService.reviewModel.findByUserId).toHaveBeenCalledWith(testUserId);
    });
    
    it('should throw an error if user is not found', async () => {
      // Override user model to return null
      preferenceService.userModel.findById.mockResolvedValueOnce(null);
      
      await expect(preferenceService.getUserPreferences(testUserId)).rejects
        .toThrow(`User with ID ${testUserId} not found`);
    });
  });
  
  describe('Genre preferences', () => {
    it('should correctly calculate genre preferences based on ratings and favorites', async () => {
      const preferences = await preferenceService.getUserPreferences(testUserId);
      const genres = preferences.genres;
      
      // Fantasy should have highest score (from a 5-star review + favorite)
      expect(genres[0].genre).toBe('Fantasy');
      
      // Check that genres are sorted by score
      expect(genres[0].score).toBeGreaterThan(genres[1].score);
    });
  });
  
  describe('Author preferences', () => {
    it('should correctly identify preferred authors', async () => {
      const preferences = await preferenceService.getUserPreferences(testUserId);
      const authors = preferences.authors;
      
      // Author A should have highest score (from a 5-star review + favorite)
      expect(authors[0].author).toBe('Author A');
      
      // Check that authors are sorted by score
      expect(authors[0].score).toBeGreaterThan(authors[1].score);
    });
  });
  
  describe('Rating patterns', () => {
    it('should calculate average rating and distribution correctly', async () => {
      const preferences = await preferenceService.getUserPreferences(testUserId);
      const ratingPattern = preferences.ratingPattern;
      
      // Average: (5 + 4 + 2) / 3 = 3.67
      expect(ratingPattern.averageRating).toBeCloseTo(3.67, 2);
      
      // Rating distribution
      expect(ratingPattern.ratingDistribution[5]).toBe(1);
      expect(ratingPattern.ratingDistribution[4]).toBe(1);
      expect(ratingPattern.ratingDistribution[2]).toBe(1);
      
      // Rating bias (average is above 3 but below 4)
      expect(ratingPattern.ratingBias).toBe('neutral');
    });
    
    it('should handle empty reviews gracefully', async () => {
      // Override review model to return empty array
      preferenceService.reviewModel.findByUserId.mockResolvedValueOnce([]);
      
      const preferences = await preferenceService.getUserPreferences(testUserId);
      const ratingPattern = preferences.ratingPattern;
      
      expect(ratingPattern.averageRating).toBe(0);
      expect(ratingPattern.ratingBias).toBe('neutral');
    });
  });
});
