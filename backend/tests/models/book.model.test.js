const bookModel = require('../../src/models/book.model');
const fs = require('fs').promises;
const path = require('path');
const { getDataFilePath } = require('../../src/config/db');
const { seedBooks } = require('../../src/data/seedData');

// Mock path for testing
jest.mock('../../src/config/db', () => ({
  getDataFilePath: jest.fn(() => path.join(__dirname, '../mocks/books.test.json'))
}));

describe('Book Model', () => {
  // Setup test data
  beforeAll(async () => {
    // Create test directory if it doesn't exist
    const testDir = path.join(__dirname, '../mocks');
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Seed the test data
    const books = await seedBooks();
    expect(books.length).toBeGreaterThan(0);
  });
  
  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.unlink(getDataFilePath());
    } catch (err) {
      console.error('Error cleaning up test data:', err);
    }
  });
  
  describe('findAll', () => {
    test('should return all books', async () => {
      const books = await bookModel.findAll();
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBeGreaterThan(0);
    });
  });
  
  describe('findById', () => {
    test('should return a book when given a valid ID', async () => {
      const books = await bookModel.findAll();
      const testBook = books[0];
      
      const book = await bookModel.findById(testBook.id);
      expect(book).toBeDefined();
      expect(book.id).toBe(testBook.id);
      expect(book.title).toBe(testBook.title);
    });
    
    test('should return undefined for invalid ID', async () => {
      const book = await bookModel.findById('invalid-id');
      expect(book).toBeUndefined();
    });
  });
  
  describe('search', () => {
    test('should find books matching title search', async () => {
      const books = await bookModel.search('harry');
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBeGreaterThan(0);
      expect(books[0].title.toLowerCase()).toContain('harry');
    });
    
    test('should find books matching author search', async () => {
      const books = await bookModel.search('tolkien');
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBeGreaterThan(0);
      expect(books[0].author.toLowerCase()).toContain('tolkien');
    });
    
    test('should return empty array for no matches', async () => {
      const books = await bookModel.search('xyznonexistent');
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBe(0);
    });
    
    test('should filter by genre when provided', async () => {
      const books = await bookModel.search('fiction', { genre: 'Classic' });
      expect(Array.isArray(books)).toBe(true);
      books.forEach(book => {
        expect(book.genres).toContain('Classic');
      });
    });
    
    test('should filter by year range when provided', async () => {
      const yearFrom = 1950;
      const yearTo = 2000;
      
      const books = await bookModel.search('fiction', { 
        yearFrom, 
        yearTo 
      });
      
      expect(Array.isArray(books)).toBe(true);
      books.forEach(book => {
        expect(book.publishedYear).toBeGreaterThanOrEqual(yearFrom);
        expect(book.publishedYear).toBeLessThanOrEqual(yearTo);
      });
    });
    
    test('should filter by minimum rating when provided', async () => {
      const minRating = 4.5;
      
      const books = await bookModel.search('fiction', { minRating });
      
      expect(Array.isArray(books)).toBe(true);
      books.forEach(book => {
        expect(book.averageRating).toBeGreaterThanOrEqual(minRating);
      });
    });
  });
  
  describe('getPaginated', () => {
    test('should return paginated results', async () => {
      const page = 1;
      const limit = 5;
      
      const result = await bookModel.getPaginated(page, limit);
      
      expect(result.books.length).toBeLessThanOrEqual(limit);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });
    
    test('should handle sorting by title ascending', async () => {
      const result = await bookModel.getPaginated(1, 10, 'title', 'asc');
      
      const titles = result.books.map(book => book.title);
      const sortedTitles = [...titles].sort();
      
      expect(titles).toEqual(sortedTitles);
    });
    
    test('should handle sorting by title descending', async () => {
      const result = await bookModel.getPaginated(1, 10, 'title', 'desc');
      
      const titles = result.books.map(book => book.title);
      const sortedTitles = [...titles].sort().reverse();
      
      expect(titles).toEqual(sortedTitles);
    });
    
    test('should handle sorting by rating', async () => {
      const result = await bookModel.getPaginated(1, 10, 'averageRating', 'desc');
      
      for (let i = 0; i < result.books.length - 1; i++) {
        expect(result.books[i].averageRating).toBeGreaterThanOrEqual(result.books[i + 1].averageRating);
      }
    });
  });
  
  describe('findByGenre', () => {
    test('should find books by genre', async () => {
      const genre = 'Fantasy';
      const books = await bookModel.findByGenre(genre);
      
      expect(Array.isArray(books)).toBe(true);
      books.forEach(book => {
        expect(book.genres).toContain(genre);
      });
    });
    
    test('should return empty array for non-existent genre', async () => {
      const books = await bookModel.findByGenre('NonExistentGenre');
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBe(0);
    });
  });
});
