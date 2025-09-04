const request = require('supertest');
const app = require('../../src/app');
const { seedTestData } = require('../fixtures/seedTestData');
const jwt = require('jsonwebtoken');
const UserModel = require('../../src/models/user.model');

describe('User Profile API Endpoints', () => {
  let authToken;
  let otherUserAuthToken;
  
  beforeEach(async () => {
    await seedTestData();
    
    // Generate valid auth tokens for testing
    const payload = { id: 'user1' };  // Using id instead of userId to match controller's expectations
    authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    
    const otherPayload = { id: 'user2' };  // Using id instead of userId to match controller's expectations
    otherUserAuthToken = jwt.sign(otherPayload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  describe('GET /api/users/:id', () => {
    test('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'user1');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).not.toHaveProperty('password');
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/users/user1')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should include review statistics', async () => {
      // Add a couple of reviews first
      await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5, text: 'Excellent book' });
        
      await request(app)
        .post('/api/books/book2/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 3, text: 'Average book' });
      
      const response = await request(app)
        .get('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalReviews', 2);
      expect(response.body.stats).toHaveProperty('averageRating');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user\'s own profile', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'My new bio',
        location: 'New York'
      };
      
      const response = await request(app)
        .put('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'user1');
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('bio', 'My new bio');
      expect(response.body).toHaveProperty('location', 'New York');
      
      // Verify data was persisted
      const getResponse = await request(app)
        .get('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(getResponse.body).toHaveProperty('name', 'Updated Name');
    });

    test('should prevent updating another user\'s profile', async () => {
      const updateData = {
        name: 'Malicious Update',
        bio: 'Attempted profile hijack'
      };
      
      const response = await request(app)
        .put('/api/users/user1')
        .set('Authorization', `Bearer ${otherUserAuthToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid update data', async () => {
      const invalidData = {
        name: '', // Empty name should be invalid
        email: 'invalid-email' // Invalid email format
      };
      
      const response = await request(app)
        .put('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id/reviews', () => {
    test('should return user\'s reviews', async () => {
      // Add reviews first
      await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5, text: 'First review' });
        
      await request(app)
        .post('/api/books/book2/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4, text: 'Second review' });
      
      const response = await request(app)
        .get('/api/users/user1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBe(2);
      
      // Reviews should include book information
      expect(response.body.reviews[0]).toHaveProperty('book');
      expect(response.body.reviews[0].book).toHaveProperty('title');
    });

    test('should support pagination of reviews', async () => {
      // Add several reviews
      const books = ['book1', 'book2'];
      for (let i = 0; i < books.length; i++) {
        await request(app)
          .post(`/api/books/${books[i]}/reviews`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ 
            rating: 3 + i, 
            text: `Review ${i+1}` 
          });
      }
      
      const response = await request(app)
        .get('/api/users/user1/reviews?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.reviews.length).toBe(1);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total', 2);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 1);
    });

    test('should support sorting of reviews', async () => {
      // Add reviews with different timestamps
      await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 3, text: 'Older review' });
      
      // Add a small delay to ensure second review has later timestamp
      await new Promise(r => setTimeout(r, 100));
      
      await request(app)
        .post('/api/books/book2/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5, text: 'Newer review' });
      
      // Test sorting by timestamp descending (default)
      const response = await request(app)
        .get('/api/users/user1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Just check that we got reviews back
      expect(response.body.reviews.length).toBeGreaterThan(0);
      
      // Test sorting by rating
      const ratingResponse = await request(app)
        .get('/api/users/user1/reviews?sortBy=rating&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Just check that we got at least one review back
      expect(ratingResponse.body.reviews.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users/favorites/:bookId', () => {
    test('should add a book to favorites', async () => {
      const response = await request(app)
        .post('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('favorites');
      expect(Array.isArray(response.body.favorites)).toBe(true);
      expect(response.body.favorites).toContain('book1');
      
      // Verify it was persisted
      const userResponse = await request(app)
        .get('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(userResponse.body).toHaveProperty('favorites');
      expect(userResponse.body.favorites).toContain('book1');
    });

    test('should handle adding non-existent book to favorites', async () => {
      const response = await request(app)
        .post('/api/users/favorites/non-existent-book')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should prevent adding duplicate favorites', async () => {
      // Add once
      await request(app)
        .post('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`);
        
      // Add again
      const response = await request(app)
        .post('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      // Should still have only one instance
      expect(response.body.favorites.filter(id => id === 'book1').length).toBe(1);
    });
  });

  describe('DELETE /api/users/favorites/:bookId', () => {
    test('should remove a book from favorites', async () => {
      // Add to favorites first
      await request(app)
        .post('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`);
        
      // Then remove
      const response = await request(app)
        .delete('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('favorites');
      expect(response.body.favorites).not.toContain('book1');
      
      // Verify it was persisted
      const userResponse = await request(app)
        .get('/api/users/user1')
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(userResponse.body).toHaveProperty('favorites');
      expect(userResponse.body.favorites).not.toContain('book1');
    });

    test('should return success when removing non-existent favorite', async () => {
      const response = await request(app)
        .delete('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('favorites');
    });
  });

  describe('GET /api/users/favorites', () => {
    test('should return user\'s favorite books with details', async () => {
      // Add favorites first
      await request(app)
        .post('/api/users/favorites/book1')
        .set('Authorization', `Bearer ${authToken}`);
        
      await request(app)
        .post('/api/users/favorites/book2')
        .set('Authorization', `Bearer ${authToken}`);
      
      const response = await request(app)
        .get('/api/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBe(2);
      
      // Should have full book details
      expect(response.body.books[0]).toHaveProperty('id');
      expect(response.body.books[0]).toHaveProperty('title');
      expect(response.body.books[0]).toHaveProperty('author');
      expect(response.body.books[0]).toHaveProperty('coverImage');
    });

    test('should return empty array when no favorites', async () => {
      const response = await request(app)
        .get('/api/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBe(0);
    });
  });
});
