// __tests__/services/bookService.test.ts
import { http, HttpResponse } from 'msw';
import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { setupServer } from 'msw/node';
import bookService from '../../services/bookService';
import { mockBooks } from '../mocks/data-factories';

// Setup MSW server
const server = setupServer(
  http.get('*/api/books', () => {
    return HttpResponse.json({
      books: mockBooks(3),
      totalBooks: 3,
      totalPages: 1
    });
  }),
  
  http.get('*/api/books/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      book: {
        id,
        title: `Book ${id}`,
        author: 'Test Author',
        averageRating: 4.5,
        reviewCount: 10,
        description: 'Test description',
        coverImage: 'test-cover.jpg',
        genre: 'Fiction'
      }
    });
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
  });

  test('getBookById fetches a single book correctly', async () => {
    const bookId = '123';
    const result = await bookService.getBookById(bookId);
    
    expect(result.book.id).toBe(bookId);
    expect(result.book.title).toBe(`Book ${bookId}`);
    expect(result.book.author).toBe('Test Author');
  });
});
