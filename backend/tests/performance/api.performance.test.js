const request = require('supertest');
const app = require('../../src/app');
const { seedTestData } = require('../fixtures/seedTestData');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

describe('API Performance Tests', () => {
  let authToken;
  
  beforeEach(async () => {
    await seedTestData();
    
    // Generate a valid auth token for testing
    const payload = { userId: 'user1' };
    authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });
  
  // Helper function to measure response time
  const measureResponseTime = async (requestFn) => {
    const start = Date.now();
    await requestFn();
    return Date.now() - start;
  };

  describe('Book API Performance', () => {
    test('should respond to book listing within acceptable time', async () => {
      const responseTime = await measureResponseTime(() => 
        request(app).get('/api/books')
      );
      
      // Typically expect responses in under 200ms in a development environment
      expect(responseTime).toBeLessThan(200);
    });

    test('should handle pagination efficiently', async () => {
      // Test with various page sizes
      const pageSizes = [10, 20, 50];
      
      for (const limit of pageSizes) {
        const responseTime = await measureResponseTime(() => 
          request(app).get(`/api/books?page=1&limit=${limit}`)
        );
        
        // Larger result sets should still return quickly
        expect(responseTime).toBeLessThan(200);
      }
    });

    test('should perform book search efficiently', async () => {
      const responseTime = await measureResponseTime(() => 
        request(app).get('/api/books/search?query=Test')
      );
      
      expect(responseTime).toBeLessThan(200);
    });

    test('should handle complex search parameters efficiently', async () => {
      const responseTime = await measureResponseTime(() => 
        request(app).get('/api/books/search?query=Test&genres=Fiction&year=2020&minRating=3')
      );
      
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Review API Performance', () => {
    test('should retrieve reviews within acceptable time', async () => {
      // Create several reviews first
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/books/book1/reviews')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            rating: 3 + (i % 3),
            text: `Performance test review ${i}`
          });
      }
      
      const responseTime = await measureResponseTime(() => 
        request(app).get('/api/books/book1/reviews')
      );
      
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('User Profile Performance', () => {
    test('should retrieve user profile efficiently', async () => {
      const responseTime = await measureResponseTime(() => 
        request(app)
          .get('/api/users/user1')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      expect(responseTime).toBeLessThan(200);
    });

    test('should retrieve user reviews efficiently', async () => {
      // Create several reviews first
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/api/books/book${(i % 2) + 1}/reviews`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            rating: 3 + (i % 3),
            text: `Performance test review ${i}`
          });
      }
      
      const responseTime = await measureResponseTime(() => 
        request(app)
          .get('/api/users/user1/reviews')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Recommendation API Performance', () => {
    test('should generate recommendations within acceptable time', async () => {
      // Create reviews and favorites to have data for recommendations
      await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5, text: 'Loved it!' });
        
      await request(app)
        .post('/api/users/favorites/book2')
        .set('Authorization', `Bearer ${authToken}`);
      
      const responseTime = await measureResponseTime(() => 
        request(app)
          .get('/api/recommendations')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      // Recommendations can take longer due to AI processing
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Authentication Performance', () => {
    test('should process login requests efficiently', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const responseTime = await measureResponseTime(() => 
        request(app)
          .post('/api/auth/login')
          .send(credentials)
      );
      
      // Allow more time for authentication due to bcrypt processing
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Data Model Performance', () => {
    test('should handle data file reads efficiently', async () => {
      const start = Date.now();
      
      // Read all three data files
      await Promise.all([
        request(app).get('/api/books'),
        request(app).get('/api/books/book1/reviews'),
        request(app).get('/api/auth/me').set('Authorization', `Bearer ${authToken}`)
      ]);
      
      const totalTime = Date.now() - start;
      
      // Parallel reads should be efficient
      expect(totalTime).toBeLessThan(500);
    });
  });
});
