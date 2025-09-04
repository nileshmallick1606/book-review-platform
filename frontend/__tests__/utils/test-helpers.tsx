// __tests__/utils/test-helpers.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../../store/auth-context';

// Default mock user for authenticated tests
export const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com'
};

// Interface for renderWithAuth options
interface CustomRenderOptions extends RenderOptions {
  isAuthenticated?: boolean;
  user?: typeof mockUser | null;
}

/**
 * Renders a component with the AuthProvider wrapper for easy testing of authenticated components
 * @param ui - React component to render
 * @param options - Render options including authentication state
 */
export function renderWithAuth(
  ui: ReactElement,
  { 
    isAuthenticated = true, 
    user = mockUser,
    ...renderOptions 
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider initialAuthState={{ isAuthenticated, user }}>
      {children}
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Creates an object with book data for testing
 * @param overrides - Properties to override in the default book object
 */
export function createMockBook(overrides = {}) {
  return {
    id: 'book123',
    title: 'Test Book Title',
    author: 'Test Author',
    description: 'This is a test book description that is long enough to test the description preview functionality',
    coverImage: 'https://example.com/test-cover.jpg',
    genres: ['Fiction', 'Fantasy', 'Adventure', 'Science Fiction'],
    publishedYear: 2023,
    averageRating: 4.5,
    reviewCount: 10,
    ...overrides
  };
}

/**
 * Creates an object with review data for testing
 * @param overrides - Properties to override in the default review object
 */
export function createMockReview(overrides = {}) {
  return {
    id: 'review123',
    bookId: 'book123',
    userId: 'user123',
    text: 'This is a test review with enough text to test any truncation or formatting features.',
    rating: 4,
    timestamp: '2023-08-01T12:00:00Z',
    ...overrides
  };
}

// Mock service functions
export const mockServiceResponse = (data: any) => {
  return Promise.resolve(data);
};
