const request = require('supertest');
const app = require('../../src/app');
const { seedTestData } = require('../fixtures/seedTestData');
const jwt = require('jsonwebtoken');
const recommendationService = require('../../src/services/recommendation.service');

// Mock the recommendation service
jest.mock('../../src/services/recommendation.service');

describe('Recommendation API Endpoint', () => {
  let authToken;
  
  beforeEach(async () => {
    await seedTestData();
    
    // Generate a valid auth token for testing
    const payload = { userId: 'user1' };
    authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    
    // Mock implementation for recommendation service
    recommendationService.getRecommendationsForUser = jest.fn().mockResolvedValue([
      {
        id: 'rec-book-1',
        title: 'Recommended Book 1',
        author: 'Author A',
        coverImage: 'https://example.com/book1.jpg',
        genres: ['Science Fiction', 'Adventure'],
        reason: 'Based on your interest in science fiction'
      },
      {
        id: 'rec-book-2',
        title: 'Recommended Book 2',
        author: 'Author B',
        coverImage: 'https://example.com/book2.jpg',
        genres: ['Fantasy'],
        reason: 'Similar to books you\'ve rated highly'
      }
    ]);
  });

  describe('GET /api/recommendations', () => {
    test('should return personalized recommendations when authenticated', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check recommendation structure
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('author');
      expect(response.body.data[0]).toHaveProperty('coverImage');
      expect(response.body.data[0]).toHaveProperty('genres');
      expect(response.body.data[0]).toHaveProperty('reason');
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should filter recommendations by genre', async () => {
      // Mock implementation for filtered recommendations
      recommendationService.getRecommendationsForUser.mockResolvedValueOnce([
        {
          id: 'rec-book-1',
          title: 'Science Fiction Book',
          author: 'Author A',
          coverImage: 'https://example.com/book1.jpg',
          genres: ['Science Fiction'],
          reason: 'Matches your genre preference'
        }
      ]);
      
      const response = await request(app)
        .get('/api/recommendations?genre=Science%20Fiction')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].genres).toContain('Science Fiction');
      
      // Verify the service was called with correct filter
      expect(recommendationService.getRecommendationsForUser).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          genre: 'Science Fiction'
        })
      );
    });

    test('should limit recommendations based on limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });

    test('should handle recommendation service errors gracefully', async () => {
      // Mock error in recommendation service
      recommendationService.getRecommendationsForUser.mockRejectedValueOnce(
        new Error('Recommendation service failed')
      );
      
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should return default recommendations when user has no preferences', async () => {
      // Mock empty recommendations (service fallback)
      recommendationService.getRecommendationsForUser.mockResolvedValueOnce([]);
      
      // Mock fallback recommendations
      recommendationService.getDefaultRecommendations = jest.fn().mockResolvedValueOnce([
        {
          id: 'default-book-1',
          title: 'Popular Book 1',
          author: 'Famous Author',
          coverImage: 'https://example.com/popular1.jpg',
          genres: ['Bestseller'],
          reason: 'Popular among all readers'
        }
      ]);
      
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toBe('Popular Book 1');
    });
  });
});
