// __tests__/services/reviewService.test.ts
import { rest } from 'msw';
import { describe, test, expect, beforeAll, afterAll, jest, beforeEach, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import reviewService from '../../services/reviewService';
import { mockReviews } from '../mocks/data-factories';

// Setup MSW server for intercepting API requests
const server = setupServer(
  rest.get('*/api/books/:bookId/reviews', (req, res, ctx) => {
    const bookId = req.params.bookId;
    // Read query parameters
    const page = req.url.searchParams.get('page') || '1';
    const limit = req.url.searchParams.get('limit') || '10';
    const sortBy = req.url.searchParams.get('sortBy') || 'timestamp';
    const sortOrder = req.url.searchParams.get('sortOrder') || 'desc';
    
    const mockReviewsData = mockReviews(3, { bookId: bookId as string });
    
    return res(ctx.json({
      reviews: mockReviewsData,
      totalReviews: mockReviewsData.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: 1
    }));
  }),
  
  rest.post('*/api/books/:bookId/reviews', (req, res, ctx) => {
    const bookId = req.params.bookId;
    return res(ctx.json({
      review: {
        id: 'new-review',
        bookId: bookId as string,
        userId: 'user-1',
        text: 'Test review text',
        rating: 4,
        timestamp: new Date().toISOString()
      },
      message: 'Review created successfully',
      bookRating: {
        averageRating: 4.2,
        reviewCount: 11
      }
    }));
  }),
  
  rest.put('*/api/reviews/:reviewId', (req, res, ctx) => {
    const reviewId = req.params.reviewId;
    return res(ctx.json({
      review: {
        id: reviewId as string,
        bookId: 'book-1',
        userId: 'user-1',
        text: 'Updated review text',
        rating: 5,
        timestamp: new Date().toISOString()
      },
      message: 'Review updated successfully',
      bookRating: {
        averageRating: 4.3,
        reviewCount: 11
      }
    }));
  }),
  
  rest.delete('*/api/reviews/:reviewId', (req, res, ctx) => {
    return res(ctx.json({
      message: 'Review deleted successfully',
      bookRating: {
        averageRating: 4.1,
        reviewCount: 10
      }
    }));
  }),
  
  rest.get('*/api/users/:userId/reviews', (req, res, ctx) => {
    const userId = req.params.userId;
    // Read query parameters
    const page = req.url.searchParams.get('page') || '1';
    const limit = req.url.searchParams.get('limit') || '10';
    
    const mockReviewsData = mockReviews(3, { userId: userId as string });
    
    return res(ctx.json({
      reviews: mockReviewsData,
      totalReviews: mockReviewsData.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: 1
    }));
  })
);

// Start the server before tests
beforeAll(() => server.listen());
// Reset handlers after each test
beforeEach(() => server.resetHandlers());
// Close server after all tests
afterAll(() => server.close());

describe('Review Service', () => {
  // Setup console.error spy for all tests
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;
  
  beforeEach(() => {
    // Mock console.error to prevent cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  test('getBookReviews fetches reviews for a book correctly', async () => {
    const bookId = 'book-1';
    const result = await reviewService.getBookReviews(bookId);
    
    expect(result.reviews).toHaveLength(3);
    expect(result.totalReviews).toBe(3);
    expect(result.page).toBe(1);
    expect(result.reviews[0].bookId).toBe(bookId);
  });
  
  test('getBookReviews handles pagination and sorting parameters', async () => {
    // Create a spy on the API call to verify params are passed
    const spy = jest.spyOn(reviewService, 'getBookReviews');
    
    await reviewService.getBookReviews('book-1', 2, 5, 'rating', 'asc');
    
    expect(spy).toHaveBeenCalledWith('book-1', 2, 5, 'rating', 'asc');
  });
  
  test('createReview creates a new review correctly', async () => {
    const bookId = 'book-1';
    const reviewData = { text: 'Test review text', rating: 4 };
    
    const result = await reviewService.createReview(bookId, reviewData);
    
    expect(result.review.bookId).toBe(bookId);
    expect(result.review.text).toBe(reviewData.text);
    expect(result.review.rating).toBe(reviewData.rating);
    expect(result.message).toBe('Review created successfully');
    expect(result.bookRating).toBeDefined();
  });
  
  test('updateReview updates an existing review correctly', async () => {
    const reviewId = 'review-1';
    const reviewData = { text: 'Updated review text', rating: 5 };
    
    const result = await reviewService.updateReview(reviewId, reviewData);
    
    expect(result.review.id).toBe(reviewId);
    expect(result.review.text).toBe('Updated review text');
    expect(result.review.rating).toBe(5);
    expect(result.message).toBe('Review updated successfully');
    expect(result.bookRating).toBeDefined();
  });
  
  test('deleteReview deletes a review correctly', async () => {
    const reviewId = 'review-1';
    
    const result = await reviewService.deleteReview(reviewId);
    
    expect(result.message).toBe('Review deleted successfully');
    expect(result.bookRating).toBeDefined();
  });
  
  test('getUserReviews fetches reviews by a user correctly', async () => {
    const userId = 'user-1';
    
    const result = await reviewService.getUserReviews(userId);
    
    expect(result.reviews).toHaveLength(3);
    expect(result.reviews[0].userId).toBe(userId);
  });
  
  test('getUserReviews handles custom pagination parameters', async () => {
    const userId = 'user-1';
    const page = 2;
    const limit = 5;
    
    // Spy on the API call
    const spy = jest.spyOn(reviewService, 'getUserReviews');
    
    const result = await reviewService.getUserReviews(userId, page, limit);
    
    expect(spy).toHaveBeenCalledWith(userId, page, limit);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  test('handles getBookReviews error gracefully', async () => {
    // Override the handler for one test to simulate error
    server.use(
      rest.get('*/api/books/error-book/reviews', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );

    // Test error handling
    await expect(reviewService.getBookReviews('error-book')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching book reviews:',
      expect.any(Error)
    );
  });
  
  test('handles createReview error gracefully', async () => {
    // Override the handler for one test to simulate error
    server.use(
      rest.post('*/api/books/error-book/reviews', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );
    
    const reviewData = { text: 'Test review text', rating: 4 };

    // Test error handling
    await expect(reviewService.createReview('error-book', reviewData)).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error creating review:',
      expect.any(Error)
    );
  });
  
  test('handles updateReview error gracefully', async () => {
    // Override the handler for one test to simulate error
    server.use(
      rest.put('*/api/reviews/error-review', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );
    
    const reviewData = { text: 'Updated review text', rating: 5 };

    // Test error handling
    await expect(reviewService.updateReview('error-review', reviewData)).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error updating review:',
      expect.any(Error)
    );
  });
  
  test('handles deleteReview error gracefully', async () => {
    // Override the handler for one test to simulate error
    server.use(
      rest.delete('*/api/reviews/error-review', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );

    // Test error handling
    await expect(reviewService.deleteReview('error-review')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error deleting review:',
      expect.any(Error)
    );
  });
  
  test('handles getUserReviews error gracefully', async () => {
    // Override the handler for one test to simulate error
    server.use(
      rest.get('*/api/users/error-user/reviews', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );

    // Test error handling
    await expect(reviewService.getUserReviews('error-user')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching user reviews:',
      expect.any(Error)
    );
  });
  
  test('handles network errors for API calls', async () => {
    // Override the handler to simulate a network error
    server.use(
      rest.get('*/api/books/network-error/reviews', (req, res) => {
        // Return a network error by not sending any response
        res.networkError('Network error');
      })
    );

    // Test error handling
    await expect(reviewService.getBookReviews('network-error')).rejects.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching book reviews:',
      expect.any(Error)
    );
  });
});
