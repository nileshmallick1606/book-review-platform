// __tests__/services/bookService.test.ts
import { rest } from 'msw';
import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { setupServer } from 'msw/node';
import bookService from '../../services/bookService';
import { mockBooks } from '../mocks/data-factories';

// Setup MSW server
const server = setupServer(
  rest.get('*/api/books', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1';
    const limit = req.url.searchParams.get('limit') || '10';
    const sortBy = req.url.searchParams.get('sortBy') || 'title';
    const sortOrder = req.url.searchParams.get('sortOrder') || 'asc';
    const minRating = req.url.searchParams.get('minRating');
    
    const mockBookData = mockBooks(3);
    
    return res(ctx.json({
      books: mockBookData,
      totalBooks: mockBookData.length,
      totalPages: 1,
      page: Number(page),
      limit: Number(limit),
      params: { sortBy, sortOrder, minRating }
    }));
  }),
  
  rest.get('*/api/books/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    const genre = req.url.searchParams.get('genre');
    const yearFrom = req.url.searchParams.get('yearFrom');
    const yearTo = req.url.searchParams.get('yearTo');
    
    const mockBookData = mockBooks(2, { 
      title: query ? `Book about ${query}` : 'Search result'
    });
    
    return res(ctx.json({
      books: mockBookData,
      totalBooks: mockBookData.length,
      query,
      filters: { genre, yearFrom, yearTo }
    }));
  }),
  
  rest.get('*/api/books/:id', (req, res, ctx) => {
    const id = req.params.id;
    const includeReviews = req.url.searchParams.get('includeReviews') === 'true';
    
    return res(ctx.json({
      book: {
        id,
        title: `Book ${id}`,
        author: 'Test Author',
        averageRating: 4.5,
        reviewCount: 10,
        description: 'Test description',
        coverImage: 'test-cover.jpg',
        genres: ['Fiction'],
        publishedYear: 2022
      },
      reviews: includeReviews ? [
        { id: 'review-1', text: 'Great book', rating: 5 }
      ] : undefined
    }));
  }),
  
  rest.get('*/api/books/:id/ratings', (req, res, ctx) => {
    const id = req.params.id;
    
    return res(ctx.json({
      bookId: id,
      averageRating: 4.5,
      totalRatings: 10,
      distribution: {
        '1': 0,
        '2': 1,
        '3': 1,
        '4': 3,
        '5': 5
      }
    }));
  })
);

// Start the server before tests
beforeAll(() => server.listen());
// Reset handlers after each test
afterAll(() => server.close());

describe('Book Service', () => {
  test('getBooks fetches books correctly', async () => {
    const result = await bookService.getBooks();
    
    expect(result.books).toHaveLength(3);
    expect(result.totalBooks).toBe(3);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });
  
  test('getBooks handles pagination, sorting, and rating filter', async () => {
    const result = await bookService.getBooks(2, 5, 'averageRating', 'desc', 4);
    
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.params.sortBy).toBe('averageRating');
    expect(result.params.sortOrder).toBe('desc');
    expect(result.params.minRating).toBe('4');
  });

  test('getBookById fetches a single book correctly', async () => {
    const bookId = '123';
    const result = await bookService.getBookById(bookId);
    
    expect(result.book.id).toBe(bookId);
    expect(result.book.title).toBe(`Book ${bookId}`);
    expect(result.book.author).toBe('Test Author');
    expect(result.reviews).toBeUndefined();
  });
  
  test('getBookById can include reviews when requested', async () => {
    const bookId = '123';
    const result = await bookService.getBookById(bookId, true);
    
    expect(result.book.id).toBe(bookId);
    expect(result.reviews).toBeDefined();
    expect(result.reviews).toHaveLength(1);
  });
  
  test('searchBooks searches books by query and filters', async () => {
    const query = 'fantasy';
    const filters = {
      genre: 'Fiction',
      yearFrom: 2000,
      yearTo: 2023,
      minRating: 4
    };
    
    const result = await bookService.searchBooks(query, filters);
    
    expect(result.books).toHaveLength(2);
    expect(result.query).toBe(query);
    expect(result.filters.genre).toBe(filters.genre);
    expect(result.filters.yearFrom).toBe(filters.yearFrom.toString());
    expect(result.filters.yearTo).toBe(filters.yearTo.toString());
  });
  
  test('getBookRatingDetails fetches rating details correctly', async () => {
    const bookId = '123';
    const result = await bookService.getBookRatingDetails(bookId);
    
    expect(result.bookId).toBe(bookId);
    expect(result.averageRating).toBe(4.5);
    expect(result.totalRatings).toBe(10);
    expect(result.distribution).toBeDefined();
    expect(result.distribution['5']).toBe(5);
  });
  
  test('handles errors gracefully in getBookById', async () => {
    // Override server handler for one test to simulate error
    server.use(
      rest.get('*/api/books/error', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );
    
    // Spy on console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test error handling
    await expect(bookService.getBookById('error')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching book with ID error:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
  
  test('handles network errors in getBooks', async () => {
    // Override server handler to simulate network error
    server.use(
      rest.get('*/api/books', (req, res) => {
        return res.networkError('Failed to connect');
      })
    );
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test error handling
    await expect(bookService.getBooks()).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching books:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
  
  test('handles errors in searchBooks', async () => {
    // Override server handler to simulate error
    server.use(
      rest.get('*/api/books/search', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Search error' }));
      })
    );
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test error handling
    await expect(bookService.searchBooks('error')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error searching books:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
  
  test('handles errors in getBookRatingDetails', async () => {
    // Override server handler to simulate error
    server.use(
      rest.get('*/api/books/error/ratings', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ message: 'Ratings not found' }));
      })
    );
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test error handling
    await expect(bookService.getBookRatingDetails('error')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching rating details for book error:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
