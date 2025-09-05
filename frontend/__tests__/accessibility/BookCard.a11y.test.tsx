// __tests__/accessibility/BookCard.a11y.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import BookCard from '../../components/book/BookCard';
import { Book } from '../../services/bookService';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the auth context
jest.mock('../../store/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({ src, alt, width, height, onError }: { src: string; alt: string; width: number; height: number; onError: () => void }) => {
    return <img src={src} alt={alt} width={width} height={height} onError={onError} data-testid="book-cover-image" />;
  };
});

describe('BookCard Accessibility Tests', () => {
  // Mock book data
  const mockBook: Book = {
    id: 'book123',
    title: 'Test Book Title',
    author: 'Test Author',
    description: 'This is a test book description that is long enough to test the description preview functionality',
    coverImage: 'https://example.com/test-cover.jpg',
    genres: ['Fiction', 'Fantasy', 'Adventure', 'Science Fiction'],
    publishedYear: 2023,
    averageRating: 4.5,
    reviewCount: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have no accessibility violations', async () => {
    const { container } = render(<BookCard book={mockBook} />);
    
    // Run axe accessibility tests
    const results = await axe(container);
    
    // Check for violations
    expect(results).toHaveNoViolations();
  });
  
  test('should have no accessibility violations with favorite button', async () => {
    // Mock auth context to show authenticated
    jest.spyOn(require('../../store/auth-context'), 'useAuth').mockReturnValueOnce({
      isAuthenticated: true,
      user: { id: 'user123' },
    });
    
    const { container } = render(<BookCard book={mockBook} isFavorite={true} />);
    
    // Run axe accessibility tests
    const results = await axe(container);
    
    // Check for violations
    expect(results).toHaveNoViolations();
  });
  
  test('should have no accessibility violations in favorites tab', async () => {
    // Mock auth context to show authenticated
    jest.spyOn(require('../../store/auth-context'), 'useAuth').mockReturnValueOnce({
      isAuthenticated: true,
      user: { id: 'user123' },
    });
    
    const { container } = render(
      <BookCard book={mockBook} isFavorite={true} inFavoritesTab={true} />
    );
    
    // Run axe accessibility tests
    const results = await axe(container);
    
    // Check for violations
    expect(results).toHaveNoViolations();
  });
});
