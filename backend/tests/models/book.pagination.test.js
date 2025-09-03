const bookModel = require('../../src/models/book.model');
const { bookFactory } = require('../utils');

describe('Book Pagination', () => {
  let mockBooks;
  
  beforeEach(() => {
    // Create an array of 25 test books
    mockBooks = Array.from({ length: 25 }, (_, i) => 
      bookFactory({ 
        title: `Test Book ${i + 1}`,
        author: `Author ${Math.floor(i / 5) + 1}`,
        publishedYear: 2000 + i,
        averageRating: (i % 5) + 1
      })
    );
  });

  describe('getPaginated', () => {
    it('should return paginated results with default parameters', () => {
      const result = bookModel.getPaginated(mockBooks, 1, 10, 'title', 'asc');
      
      expect(result).toHaveProperty('books');
      expect(result).toHaveProperty('totalBooks', 25);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('totalPages', 3);
      expect(result.books).toHaveLength(10);
    });
    
    it('should return the correct page of results', () => {
      const page1 = bookModel.getPaginated(mockBooks, 1, 10, 'title', 'asc');
      const page2 = bookModel.getPaginated(mockBooks, 2, 10, 'title', 'asc');
      const page3 = bookModel.getPaginated(mockBooks, 3, 10, 'title', 'asc');
      
      expect(page1.books).toHaveLength(10);
      expect(page2.books).toHaveLength(10);
      expect(page3.books).toHaveLength(5);
      
      // Ensure books on each page are different
      const page1Ids = page1.books.map(book => book.id);
      const page2Ids = page2.books.map(book => book.id);
      const page3Ids = page3.books.map(book => book.id);
      
      page2Ids.forEach(id => {
        expect(page1Ids).not.toContain(id);
      });
      
      page3Ids.forEach(id => {
        expect(page1Ids).not.toContain(id);
        expect(page2Ids).not.toContain(id);
      });
    });
    
    it('should respect custom page size', () => {
      const result = bookModel.getPaginated(mockBooks, 1, 5, 'title', 'asc');
      
      expect(result).toHaveProperty('limit', 5);
      expect(result).toHaveProperty('totalPages', 5);
      expect(result.books).toHaveLength(5);
    });
    
    it('should sort results correctly', () => {
      // Sort by title ascending
      const titleAsc = bookModel.getPaginated(mockBooks, 1, 25, 'title', 'asc');
      expect(titleAsc.books[0].title).toBe('Test Book 1');
      expect(titleAsc.books[24].title).toBe('Test Book 25');
      
      // Sort by title descending
      const titleDesc = bookModel.getPaginated(mockBooks, 1, 25, 'title', 'desc');
      expect(titleDesc.books[0].title).toBe('Test Book 25');
      expect(titleDesc.books[24].title).toBe('Test Book 1');
      
      // Sort by rating descending
      const ratingDesc = bookModel.getPaginated(mockBooks, 1, 25, 'averageRating', 'desc');
      expect(ratingDesc.books[0].averageRating).toBe(5);
      expect(ratingDesc.books[24].averageRating).toBe(1);
    });
    
    it('should handle empty array', () => {
      const result = bookModel.getPaginated([], 1, 10, 'title', 'asc');
      
      expect(result).toHaveProperty('books', []);
      expect(result).toHaveProperty('totalBooks', 0);
      expect(result).toHaveProperty('totalPages', 0);
    });
    
    it('should handle page number beyond available pages', () => {
      const result = bookModel.getPaginated(mockBooks, 10, 10, 'title', 'asc');
      
      expect(result).toHaveProperty('books', []);
      expect(result).toHaveProperty('page', 10);
      expect(result).toHaveProperty('totalPages', 3);
    });
  });
});
