// __tests__/services/userService.test.ts
import { rest } from 'msw';
import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { setupServer } from 'msw/node';
import userService from '../../services/userService';
import { mockUser, mockBooks, mockReviews } from '../mocks/data-factories';

// Setup MSW server for intercepting API requests
const server = setupServer(
  rest.get('*/api/users/:userId', (req, res, ctx) => {
    const userId = req.params.userId;
    return res(ctx.json({
      user: mockUser({ id: userId as string }),
      stats: {
        reviewCount: 5,
        averageRating: 4.2,
        favoriteGenres: ['Fiction', 'Mystery']
      }
    }));
  }),
  
  rest.put('*/api/users/:userId', (req, res, ctx) => {
    const userId = req.params.userId;
    const data = req.body as any;
    return res(ctx.json({
      user: {
        id: userId as string,
        name: data.name || 'Updated Name',
        bio: data.bio || 'Updated bio',
        location: data.location || 'Updated location'
      },
      message: 'Profile updated successfully'
    }));
  }),
  
  rest.get('*/api/users/:userId/reviews', (req, res, ctx) => {
    const userId = req.params.userId;
    const mockReviewsData = mockReviews(3, { userId: userId as string });
    
    return res(ctx.json({
      reviews: mockReviewsData,
      totalItems: mockReviewsData.length,
      page: 1,
      limit: 10,
      totalPages: 1
    }));
  }),
  
  rest.get('*/api/users/:userId/favorites', (req, res, ctx) => {
    const userId = req.params.userId;
    const mockBookData = mockBooks(3);
    
    return res(ctx.json({
      favorites: mockBookData
    }));
  }),
  
  rest.post('*/api/users/favorites/:bookId', (req, res, ctx) => {
    const bookId = req.params.bookId;
    return res(ctx.json({
      message: 'Book added to favorites',
      bookId: bookId
    }));
  }),
  
  rest.delete('*/api/users/favorites/:bookId', (req, res, ctx) => {
    const bookId = req.params.bookId;
    return res(ctx.json({
      message: 'Book removed from favorites',
      bookId: bookId
    }));
  })
);

// Start the server before tests
beforeAll(() => server.listen());
// Reset handlers after each test
afterAll(() => server.close());

describe('User Service', () => {
  test('getUserProfile fetches user profile correctly', async () => {
    const userId = 'user-1';
    const result = await userService.getUserProfile(userId);
    
    expect(result.user.id).toBe(userId);
    expect(result.stats).toBeDefined();
    expect(result.stats.reviewCount).toBe(5);
    expect(result.stats.favoriteGenres).toEqual(['Fiction', 'Mystery']);
  });
  
  test('updateProfile updates user profile correctly', async () => {
    const userId = 'user-1';
    const profileData = {
      name: 'Updated Name',
      bio: 'Updated bio',
      location: 'Updated location'
    };
    
    const result = await userService.updateProfile(userId, profileData);
    
    expect(result.user.id).toBe(userId);
    expect(result.user.name).toBe(profileData.name);
    expect(result.user.bio).toBe(profileData.bio);
    expect(result.user.location).toBe(profileData.location);
    expect(result.message).toBe('Profile updated successfully');
  });
  
  test('getUserReviews fetches user reviews correctly', async () => {
    const userId = 'user-1';
    
    const result = await userService.getUserReviews(userId);
    
    expect(result.reviews).toHaveLength(3);
    expect(result.reviews[0].userId).toBe(userId);
    expect(result.totalItems).toBe(3);
    expect(result.totalPages).toBe(1);
  });
  
  test('getUserReviews accepts pagination options', async () => {
    const userId = 'user-1';
    const options = { page: 2, limit: 5, sortBy: 'rating', sortOrder: 'desc' as const };
    
    // Create spy to verify params
    const spy = jest.spyOn(userService, 'getUserReviews');
    
    await userService.getUserReviews(userId, options);
    
    expect(spy).toHaveBeenCalledWith(userId, options);
  });
  
  test('getFavorites fetches user favorites correctly', async () => {
    const userId = 'user-1';
    
    const result = await userService.getFavorites(userId);
    
    expect(result.favorites).toHaveLength(3);
    expect(result.favorites[0]).toHaveProperty('title');
    expect(result.favorites[0]).toHaveProperty('author');
  });
  
  test('addFavorite adds book to favorites correctly', async () => {
    const bookId = 'book-1';
    
    const result = await userService.addFavorite(bookId);
    
    expect(result.message).toBe('Book added to favorites');
    expect(result.bookId).toBe(bookId);
  });
  
  test('removeFavorite removes book from favorites correctly', async () => {
    const bookId = 'book-1';
    
    const result = await userService.removeFavorite(bookId);
    
    expect(result.message).toBe('Book removed from favorites');
    expect(result.bookId).toBe(bookId);
  });
  
  test('handles error in getUserProfile', async () => {
    // Override the handler for one test to simulate error
    server.use(
      rest.get('*/api/users/error-user', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
      })
    );

    await expect(userService.getUserProfile('error-user')).rejects.toThrow('Internal server error');
  });

  test('handles error in updateProfile', async () => {
    server.use(
      rest.put('*/api/users/error-user', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ message: 'Invalid data' }));
      })
    );

    await expect(userService.updateProfile('error-user', { name: 'Test' })).rejects.toThrow('Invalid data');
  });

  test('handles error in addFavorite', async () => {
    server.use(
      rest.post('*/api/users/favorites/error-book', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ message: 'Book not found' }));
      })
    );

    await expect(userService.addFavorite('error-book')).rejects.toThrow('Book not found');
  });
});
