const request = require('supertest');
const app = require('../../src/app');
const bookModel = require('../../src/models/book.model');
const reviewModel = require('../../src/models/review.model');
const { 
  bookFactory, 
  clearAllTestData, 
  addTestEntity 
} = require('../utils');

// Mock authentication middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    // Add admin user to request
    req.user = { id: 'test-admin-id', isAdmin: true };
    next();
  }
}));

// Mock the book model
jest.mock('../../src/models/book.model', () => {
  const originalModule = jest.requireActual('../../src/models/book.model');
  return {
    ...originalModule,
    search: jest.fn(),
    findById: jest.fn(),
    getBookRatingsStats: jest.fn(),
    updateBookRatings: jest.fn()
  };
});

// Mock review model
jest.mock('../../src/models/review.model', () => ({
  findByBookId: jest.fn()
}));

// Mock rating utils
jest.mock('../../src/utils/rating.utils', () => ({
  calculateRatingDistribution: jest.fn(() => ({ 1: 5, 2: 10, 3: 15, 4: 20, 5: 30 })),
  getPositiveRatingPercentage: jest.fn(() => 70)
}));

describe('Book Search API', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET /api/books/search', () => {
    it('should return search results', async () => {
      // Mock search results
      const mockBooks = [
        bookFactory({ title: 'Harry Potter 1', genres: ['Fantasy'] }),
        bookFactory({ title: 'Harry Potter 2', genres: ['Fantasy'] })
      ];
      
      bookModel.search.mockResolvedValue(mockBooks);
      
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'harry potter' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('books');
      expect(response.body.books).toHaveLength(2);
      expect(bookModel.search).toHaveBeenCalledWith('harry potter', expect.any(Object));
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body).toHaveProperty('query', 'harry potter');
      expect(response.body).toHaveProperty('filters');
    });
    
    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Search query is required');
      expect(bookModel.search).not.toHaveBeenCalled();
    });
    
    it('should handle no results', async () => {
      bookModel.search.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'nonexistent book' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('books');
      expect(response.body.books).toHaveLength(0);
      expect(response.body).toHaveProperty('count', 0);
      expect(bookModel.search).toHaveBeenCalledWith('nonexistent book', expect.any(Object));
    });
    
    it('should apply genre filter correctly', async () => {
      bookModel.search.mockResolvedValue([bookFactory()]);
      
      await request(app)
        .get('/api/books/search')
        .query({ q: 'fiction', genre: 'Fantasy' });
        
      expect(bookModel.search).toHaveBeenCalledWith('fiction', expect.objectContaining({
        genre: 'Fantasy'
      }));
    });
    
    it('should apply year range filters correctly', async () => {
      bookModel.search.mockResolvedValue([bookFactory()]);
      
      await request(app)
        .get('/api/books/search')
        .query({ 
          q: 'history', 
          yearFrom: '1990', 
          yearTo: '2000' 
        });
        
      expect(bookModel.search).toHaveBeenCalledWith('history', expect.objectContaining({
        yearFrom: 1990,
        yearTo: 2000
      }));
    });
    
    it('should apply rating filters correctly', async () => {
      bookModel.search.mockResolvedValue([bookFactory()]);
      
      await request(app)
        .get('/api/books/search')
        .query({ 
          q: 'good books', 
          minRating: '4', 
          maxRating: '5' 
        });
        
      expect(bookModel.search).toHaveBeenCalledWith('good books', expect.objectContaining({
        minRating: 4,
        maxRating: 5
      }));
    });
    
    it('should apply hasReviews filter correctly', async () => {
      bookModel.search.mockResolvedValue([bookFactory()]);
      
      await request(app)
        .get('/api/books/search')
        .query({ 
          q: 'popular', 
          hasReviews: 'true'
        });
        
      expect(bookModel.search).toHaveBeenCalledWith('popular', expect.objectContaining({
        hasReviews: true
      }));
    });
    
    it('should handle invalid hasReviews parameter', async () => {
      bookModel.search.mockResolvedValue([bookFactory()]);
      
      await request(app)
        .get('/api/books/search')
        .query({ 
          q: 'popular', 
          hasReviews: 'invalid'
        });
        
      // Should be false because toLowerCase() === 'true' is false
      expect(bookModel.search).toHaveBeenCalledWith('popular', expect.objectContaining({
        hasReviews: false
      }));
    });
    
    it('should handle server errors', async () => {
      bookModel.search.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'error test' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Database error');
      expect(response.body.error).toHaveProperty('status', 500);
    });
    
    it('should handle all filters combined', async () => {
      bookModel.search.mockResolvedValue([bookFactory()]);
      
      await request(app)
        .get('/api/books/search')
        .query({ 
          q: 'complete test',
          genre: 'Fiction',
          yearFrom: '2000',
          yearTo: '2020',
          minRating: '3.5',
          maxRating: '4.5',
          hasReviews: 'true'
        });
        
      expect(bookModel.search).toHaveBeenCalledWith('complete test', expect.objectContaining({
        genre: 'Fiction',
        yearFrom: 2000,
        yearTo: 2020,
        minRating: 3.5,
        maxRating: 4.5,
        hasReviews: true
      }));
    });
  });
  
  describe('GET /api/books/:id', () => {
    it('should return a book by id', async () => {
      const mockBook = bookFactory();
      bookModel.findById.mockResolvedValue(mockBook);
      
      const response = await request(app)
        .get(`/api/books/${mockBook.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('book');
      expect(response.body.book.id).toBe(mockBook.id);
      expect(bookModel.findById).toHaveBeenCalledWith(mockBook.id);
    });
    
    it('should return 404 for non-existent book', async () => {
      bookModel.findById.mockResolvedValue(undefined);
      
      const response = await request(app)
        .get('/api/books/nonexistent-id');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/books/:id/ratings', () => {
    it('should return book rating statistics', async () => {
      const bookId = 'test-book-id';
      const mockBook = bookFactory({
        id: bookId,
        title: 'Test Book',
        averageRating: 3.8,
        reviewCount: 80
      });
      
      // Mock book found
      bookModel.findById.mockResolvedValue(mockBook);
      
      // Mock reviews found
      reviewModel.findByBookId.mockResolvedValue({
        reviews: [
          { rating: 5 }, { rating: 4 }, { rating: 3 }
        ]
      });
      
      const response = await request(app)
        .get(`/api/books/${bookId}/ratings`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('distribution');
      expect(response.body).toHaveProperty('averageRating', 3.8);
      expect(response.body).toHaveProperty('reviewCount', 80);
      expect(response.body).toHaveProperty('positivePercentage', 70);
      expect(bookModel.findById).toHaveBeenCalledWith(bookId);
      expect(reviewModel.findByBookId).toHaveBeenCalledWith(bookId, { limit: 1000 });
    });
    
    it('should return 404 for non-existent book ratings', async () => {
      // Mock book not found
      bookModel.findById.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/books/nonexistent-id/ratings');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Book not found');
    });
    
    it('should handle errors in ratings retrieval', async () => {
      // Mock error
      bookModel.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/books/error-book-id/ratings');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Database error');
    });
  });
  
  describe('POST /api/books/:id/recalculate-rating', () => {
    it('should recalculate and update book rating', async () => {
      const bookId = 'test-book-id';
      const mockResult = {
        success: true,
        averageRating: 4.2,
        reviewCount: 15
      };
      
      bookModel.updateBookRatings.mockResolvedValue(mockResult);
      
      const response = await request(app)
        .post(`/api/books/${bookId}/recalculate-rating`)
        .set('Authorization', 'Bearer test-token'); // Auth token will be handled by mocked middleware
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Book rating recalculated successfully');
      expect(response.body).toHaveProperty('averageRating', 4.2);
      expect(response.body).toHaveProperty('reviewCount', 15);
      expect(bookModel.updateBookRatings).toHaveBeenCalledWith(bookId);
    });
    
    it('should return 404 when recalculating ratings for non-existent book', async () => {
      bookModel.updateBookRatings.mockResolvedValue({
        success: false,
        message: 'Book not found'
      });
      
      const response = await request(app)
        .post('/api/books/nonexistent-id/recalculate-rating')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Book not found');
    });
    
    it('should handle errors in rating recalculation', async () => {
      bookModel.updateBookRatings.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/books/error-book-id/recalculate-rating')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Database error');
    });
  });
});
