// __tests__/mocks/data-factories.ts
import { User, Book, Review } from '../../types';

// Factory function for generating mock user data
export const mockUser = (overrides = {}): User => ({
  id: `user-${Math.floor(Math.random() * 1000)}`,
  name: 'Test User',
  email: 'test@example.com',
  favorites: [],
  ...overrides
});

// Factory function for generating multiple mock users
export const mockUsers = (count: number, overrides = {}): User[] => {
  return Array.from({ length: count }, (_, i) => mockUser({
    id: `user-${i + 1}`,
    email: `test${i + 1}@example.com`,
    ...overrides
  }));
};

// Factory function for generating mock book data
export const mockBook = (overrides = {}): Book => ({
  id: `book-${Math.floor(Math.random() * 1000)}`,
  title: 'Test Book Title',
  author: 'Test Author',
  description: 'This is a test book description that provides information about the book.',
  coverImage: 'https://example.com/test-cover.jpg',
  genres: ['Fiction', 'Test'],
  publishedYear: 2022,
  averageRating: 4.5,
  reviewCount: 10,
  ...overrides
});

// Factory function for generating multiple mock books
export const mockBooks = (count: number, overrides = {}): Book[] => {
  return Array.from({ length: count }, (_, i) => mockBook({
    id: `book-${i + 1}`,
    title: `Test Book ${i + 1}`,
    ...overrides
  }));
};

// Factory function for generating mock review data
export const mockReview = (overrides = {}): Review => ({
  id: `review-${Math.floor(Math.random() * 1000)}`,
  bookId: 'book-1',
  userId: 'user-1',
  text: 'This is a test review that provides feedback about the book.',
  rating: 4,
  timestamp: new Date().toISOString(),
  ...overrides
});

// Factory function for generating multiple mock reviews
export const mockReviews = (count: number, overrides = {}): Review[] => {
  return Array.from({ length: count }, (_, i) => mockReview({
    id: `review-${i + 1}`,
    ...overrides
  }));
};
