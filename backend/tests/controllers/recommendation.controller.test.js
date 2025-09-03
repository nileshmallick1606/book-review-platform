/**
 * Tests for Recommendation Controller
 */

const recommendationController = require('../../src/controllers/recommendation.controller');
const recommendationService = require('../../src/services/recommendation.service');

// Mock the recommendation service
jest.mock('../../src/services/recommendation.service');

describe('Recommendation Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request object
    req = {
      user: { id: 'user-123' },
      query: {}
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock next function
    next = jest.fn();
  });
  
  describe('getRecommendations', () => {
    it('should return recommendations for a user', async () => {
      // Mock sample recommendations
      const mockRecommendations = [
        { id: 'book-1', title: 'Test Book 1', author: 'Test Author 1', reason: 'Test Reason 1' },
        { id: 'book-2', title: 'Test Book 2', author: 'Test Author 2', reason: 'Test Reason 2' }
      ];
      
      // Setup mock implementation
      recommendationService.getRecommendationsForUser.mockResolvedValue(mockRecommendations);
      
      // Call controller
      await recommendationController.getRecommendations(req, res, next);
      
      // Verify service was called with correct params
      expect(recommendationService.getRecommendationsForUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          limit: 5,
          genre: null,
          forceRefresh: false
        })
      );
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockRecommendations
      });
    });
    
    it('should pass query parameters to the service', async () => {
      // Set query params
      req.query = {
        limit: '10',
        genre: 'Science Fiction',
        refresh: 'true'
      };
      
      // Mock empty recommendations
      recommendationService.getRecommendationsForUser.mockResolvedValue([]);
      
      // Call controller
      await recommendationController.getRecommendations(req, res, next);
      
      // Verify service was called with correct params
      expect(recommendationService.getRecommendationsForUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          limit: 10,
          genre: 'Science Fiction',
          forceRefresh: true
        })
      );
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const testError = new Error('Test error');
      recommendationService.getRecommendationsForUser.mockRejectedValue(testError);
      
      // Call controller
      await recommendationController.getRecommendations(req, res, next);
      
      // Verify next was called with the error
      expect(next).toHaveBeenCalledWith(testError);
      
      // Verify response was not sent
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
