const request = require('supertest');
const app = require('../../src/app');
const bookModel = require('../../src/models/book.model');
const { 
  bookFactory, 
  clearAllTestData, 
  addTestEntity 
} = require('../utils');

// Mock the book model search function
jest.mock('../../src/models/book.model', () => {
  const originalModule = jest.requireActual('../../src/models/book.model');
  return {
    ...originalModule,
    search: jest.fn()
  };
});

describe('Book Search API', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET /api/books/search', () => {
    it('should return search results', async () => {
      // Mock search results
      const mockBooks = [
        bookFactory({ title: 'Harry Potter 1' }),
        bookFactory({ title: 'Harry Potter 2' })
      ];
      
      bookModel.search.mockResolvedValue(mockBooks);
      
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'harry potter' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('books');
      expect(response.body.books).toHaveLength(2);
      expect(bookModel.search).toHaveBeenCalledWith('harry potter', expect.any(Object));
    });
    
    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
    
    it('should handle no results', async () => {
      bookModel.search.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'nonexistent book' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('books');
      expect(response.body.books).toHaveLength(0);
    });
    
    it('should handle server errors', async () => {
      bookModel.search.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'error test' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/books/:id', () => {
    it('should return a book by id', async () => {
      const mockBook = bookFactory();
      jest.spyOn(bookModel, 'findById').mockResolvedValue(mockBook);
      
      const response = await request(app)
        .get(`/api/books/${mockBook.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('book');
      expect(response.body.book.id).toBe(mockBook.id);
      expect(bookModel.findById).toHaveBeenCalledWith(mockBook.id);
    });
    
    it('should return 404 for non-existent book', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValue(undefined);
      
      const response = await request(app)
        .get('/api/books/nonexistent-id');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
});
