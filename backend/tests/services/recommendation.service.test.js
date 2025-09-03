/**
 * Tests for Recommendation Service
 */

const recommendationService = require('../../src/services/recommendation.service');
const openaiService = require('../../src/services/openai.service');
const preferenceService = require('../../src/services/preference.service');
const BookModel = require('../../src/models/book.model');
const UserModel = require('../../src/models/user.model');

// Mock dependencies
jest.mock('../../src/services/openai.service');
jest.mock('../../src/services/preference.service');
jest.mock('../../src/models/book.model');
jest.mock('../../src/models/user.model');

describe('Recommendation Service', () => {
  // Test data
  const testUserId = 'user-123';
  const testUser = { id: testUserId, name: 'Test User' };
  
  const testPreferences = {
    genres: [
      { genre: 'Science Fiction', score: 3 },
      { genre: 'Fantasy', score: 2 }
    ],
    authors: [
      { author: 'Isaac Asimov', score: 3 },
      { author: 'J.R.R. Tolkien', score: 2 }
    ],
    ratingPattern: {
      averageRating: 4.2,
      ratingBias: 'positive'
    },
    favoriteThemes: [
      { theme: 'space', score: 3 },
      { theme: 'technology', score: 2 }
    ],
    publicationEra: {
      preferredEra: 'modern'
    }
  };
  
  const testBooks = [
    { id: 'book-1', title: 'Foundation', author: 'Isaac Asimov', genres: ['Science Fiction'], averageRating: 4.5 },
    { id: 'book-2', title: 'Dune', author: 'Frank Herbert', genres: ['Science Fiction'], averageRating: 4.7 },
    { id: 'book-3', title: 'The Hobbit', author: 'J.R.R. Tolkien', genres: ['Fantasy'], averageRating: 4.8 },
    { id: 'book-4', title: 'Neuromancer', author: 'William Gibson', genres: ['Science Fiction', 'Cyberpunk'], averageRating: 4.0 }
  ];
  
  const mockOpenAIResponse = {
    id: 'test-completion-id',
    choices: [
      {
        message: {
          content: `[
            {
              "title": "Snow Crash",
              "author": "Neal Stephenson",
              "genre": "Science Fiction",
              "year": 1992,
              "reason": "This cyberpunk novel would appeal to your interest in technology themes and science fiction."
            },
            {
              "title": "The Left Hand of Darkness",
              "author": "Ursula K. Le Guin",
              "genre": "Science Fiction",
              "year": 1969,
              "reason": "This classic sci-fi novel explores complex themes that match your preference for thoughtful science fiction."
            }
          ]`
        }
      }
    ]
  };
  
  beforeEach(() => {
    // Clear all mocks and cache
    jest.clearAllMocks();
    recommendationService.recommendationCache.clear();
    
    // Mock implementations
    UserModel.mockImplementation(() => ({
      findById: jest.fn().mockResolvedValue(testUser)
    }));
    
    BookModel.mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue(testBooks)
    }));
    
    preferenceService.getUserPreferences = jest.fn().mockResolvedValue(testPreferences);
    
    openaiService.createChatCompletion = jest.fn().mockResolvedValue(mockOpenAIResponse);
  });
  
  describe('getRecommendationsForUser', () => {
    it('should return personalized recommendations for a user', async () => {
      const recommendations = await recommendationService.getRecommendationsForUser(testUserId);
      
      // Verify models and services were called
      expect(recommendationService.userModel.findById).toHaveBeenCalledWith(testUserId);
      expect(preferenceService.getUserPreferences).toHaveBeenCalledWith(testUserId);
      expect(openaiService.createChatCompletion).toHaveBeenCalled();
      
      // Verify recommendations structure
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('reason');
    });
    
    it('should filter recommendations by genre when specified', async () => {
      // Mock the parsed OpenAI response to include different genres
      const parsedResponse = [
        { title: 'Sci-Fi Book', author: 'Author A', genre: 'Science Fiction', reason: 'Matches interests' },
        { title: 'Fantasy Book', author: 'Author B', genre: 'Fantasy', reason: 'Matches interests' }
      ];
      
      // Mock the _parseOpenAIResponse method to return our custom response
      const originalParseMethod = recommendationService._parseOpenAIResponse;
      recommendationService._parseOpenAIResponse = jest.fn().mockReturnValue(parsedResponse);
      
      // Get recommendations filtered by genre
      const recommendations = await recommendationService.getRecommendationsForUser(testUserId, {
        genre: 'Fantasy'
      });
      
      // Verify filtering
      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.genres.includes('Fantasy')).toBe(true);
      });
      
      // Restore original method
      recommendationService._parseOpenAIResponse = originalParseMethod;
    });
    
    it('should return cached recommendations when available', async () => {
      // First call to populate cache
      await recommendationService.getRecommendationsForUser(testUserId);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Second call should use cache
      await recommendationService.getRecommendationsForUser(testUserId);
      
      // Verify OpenAI wasn't called again
      expect(openaiService.createChatCompletion).not.toHaveBeenCalled();
    });
    
    it('should force refresh recommendations when requested', async () => {
      // First call to populate cache
      await recommendationService.getRecommendationsForUser(testUserId);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Second call with force refresh
      await recommendationService.getRecommendationsForUser(testUserId, {
        forceRefresh: true
      });
      
      // Verify OpenAI was called again
      expect(openaiService.createChatCompletion).toHaveBeenCalled();
    });
    
    it('should fall back to default recommendations on error', async () => {
      // Mock OpenAI to throw an error
      openaiService.createChatCompletion.mockRejectedValueOnce(new Error('API Error'));
      
      // Call should not throw despite the error
      const recommendations = await recommendationService.getRecommendationsForUser(testUserId);
      
      // Should have returned default recommendations
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Verify that books are sorted by rating
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].averageRating).toBeGreaterThanOrEqual(recommendations[i+1].averageRating);
      }
    });
  });
  
  describe('_parseOpenAIResponse', () => {
    it('should parse JSON format correctly', () => {
      const result = recommendationService._parseOpenAIResponse(mockOpenAIResponse);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Snow Crash');
      expect(result[0].author).toBe('Neal Stephenson');
    });
    
    it('should handle non-JSON format gracefully', () => {
      const nonJsonResponse = {
        choices: [{
          message: {
            content: `
              Title: Hyperion
              Author: Dan Simmons
              Genre: Science Fiction
              Year: 1989
              Reason: Epic sci-fi that matches your preferences
              
              Title: Leviathan Wakes
              Author: James S.A. Corey
              Genre: Science Fiction
              Year: 2011
              Reason: Space opera that you'll enjoy
            `
          }
        }]
      };
      
      const result = recommendationService._parseOpenAIResponse(nonJsonResponse);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Hyperion');
      expect(result[1].title).toBe('Leviathan Wakes');
    });
  });
  
  describe('_findMatchingBook', () => {
    it('should find exact matches by title and author', () => {
      const recommendation = {
        title: 'Foundation',
        author: 'Isaac Asimov'
      };
      
      const match = recommendationService._findMatchingBook(recommendation, testBooks);
      
      expect(match).toBeDefined();
      expect(match.id).toBe('book-1');
    });
    
    it('should find matches with slight title variations', () => {
      const recommendation = {
        title: 'The Foundation',
        author: 'Isaac Asimov'
      };
      
      const match = recommendationService._findMatchingBook(recommendation, testBooks);
      
      expect(match).toBeDefined();
      expect(match.id).toBe('book-1');
    });
    
    it('should return null when no match is found', () => {
      const recommendation = {
        title: 'Unknown Book',
        author: 'Unknown Author'
      };
      
      const match = recommendationService._findMatchingBook(recommendation, testBooks);
      
      expect(match).toBeNull();
    });
  });
});
