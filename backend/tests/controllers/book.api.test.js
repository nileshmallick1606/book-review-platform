const request = require('supertest');
const app = require('../../src/app');
const { seedTestData } = require('../fixtures/seedTestData');
const jwt = require('jsonwebtoken');

describe('Book API Endpoints', () => {
  let authToken;
  
  beforeEach(async () => {
    await seedTestData();
    
    // Generate a valid auth token for testing with admin privileges
    const payload = { id: 'user1', isAdmin: true };  // Added isAdmin flag for recalculate-rating endpoint
    authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  describe('GET /api/books', () => {
    test('should return a paginated list of books', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('totalBooks');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    test('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/books?page=1&limit=1')
        .expect(200);

      expect(response.body.books.length).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);
    });

    test('should handle out-of-range pagination gracefully', async () => {
      const response = await request(app)
        .get('/api/books?page=999')
        .expect(200);

      // Should return an empty array for pages beyond the available data
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBe(0);
    });

    test('should handle invalid pagination parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/books?page=invalid&limit=invalid')
        .expect(200);

      // API uses default values instead of rejecting
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('books');
    });

    test('should support sorting options', async () => {
      const response = await request(app)
        .get('/api/books?sortBy=title&sortOrder=asc')
        .expect(200);

      expect(Array.isArray(response.body.books)).toBe(true);
      
      // Check if books are sorted by title in ascending order
      const titles = response.body.books.map(book => book.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    test('should handle invalid sorting options gracefully', async () => {
      const response = await request(app)
        .get('/api/books?sortBy=invalidField')
        .expect(200);

      // API uses default sorting instead of rejecting
      expect(response.body).toHaveProperty('sortBy');
      expect(response.body).toHaveProperty('books');
    });
  });

  describe('GET /api/books/search', () => {
    test('should find books matching search query', async () => {
      const response = await request(app)
        .get('/api/books/search?q=Test Book 1')
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBeGreaterThan(0);
      expect(response.body.books[0].title).toContain('Test Book 1');
    });

    test('should find books by author', async () => {
      const response = await request(app)
        .get('/api/books/search?q=Author One')
        .expect(200);

      expect(response.body.books.length).toBeGreaterThan(0);
      expect(response.body.books[0].author).toContain('Author One');
    });

    test('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/books/search?q=NonExistentBookTitle')
        .expect(200);

      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBe(0);
    });

    test('should filter by genre', async () => {
      const response = await request(app)
        .get('/api/books/search?q=Test&genre=Fiction')
        .expect(200);

      expect(response.body.books.length).toBeGreaterThan(0);
      response.body.books.forEach(book => {
        expect(book.genres).toContain('Fiction');
      });
    });

    test('should filter by publication year', async () => {
      const response = await request(app)
        .get('/api/books/search?q=Test&yearFrom=2020&yearTo=2020')
        .expect(200);

      expect(response.body.books.length).toBeGreaterThan(0);
      response.body.books.forEach(book => {
        expect(book.publishedYear).toBe(2020);
      });
    });

    test('should filter by minimum rating', async () => {
      // First, add some reviews to set ratings
      await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          text: 'Excellent book'
        });
        
      await request(app)
        .post('/api/books/book2/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 2,
          text: 'Not very good'
        });
      
      // Explicitly trigger recalculation of book ratings
      await request(app)
        .post('/api/books/book1/recalculate-rating')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      await request(app)
        .post('/api/books/book2/recalculate-rating')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Now search with minimum rating filter
      const response = await request(app)
        .get('/api/books/search?q=Test&minRating=4')
        .expect(200);

      expect(response.body.books.length).toBeGreaterThan(0);
      response.body.books.forEach(book => {
        expect(book.averageRating).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('GET /api/books/:id', () => {
    test('should return a single book by ID', async () => {
      const response = await request(app)
        .get('/api/books/book1')
        .expect(200);

      expect(response.body).toHaveProperty('book');
      expect(response.body.book).toHaveProperty('id', 'book1');
      expect(response.body.book).toHaveProperty('title');
      expect(response.body.book).toHaveProperty('author');
      expect(response.body.book).toHaveProperty('description');
    });

    test('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Book not found');
    });

    test('should include review count and average rating', async () => {
      // Add a review first
      await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          text: 'Good book'
        });
      
      // Explicitly trigger recalculation of book ratings
      await request(app)
        .post('/api/books/book1/recalculate-rating')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      // Now fetch the book details
      const response = await request(app)
        .get('/api/books/book1')
        .expect(200);

      expect(response.body.book).toHaveProperty('reviewCount');
      expect(response.body.book).toHaveProperty('averageRating', 4);
    });
  });
});
