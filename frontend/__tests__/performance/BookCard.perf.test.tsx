// __tests__/performance/BookCard.perf.test.tsx
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import BookCard from '../../components/book/BookCard';
import { Book } from '../../services/bookService';
import { measureRenderTime } from '../utils/performance-utils';

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

describe('BookCard Performance Tests', () => {
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
  
  afterEach(() => {
    cleanup();
  });

  test('renders efficiently (simple render time test)', () => {
    // Measure time to render the component
    const renderTime = measureRenderTime(() => {
      render(<BookCard book={mockBook} />);
      cleanup();
    }, 10); // 10 iterations for more accurate measurement
    
    console.log(`BookCard render time: ${renderTime.toFixed(2)}ms`);
    
    // In a real performance test, we'd have expectations based on benchmarks
    // For now, we just ensure it renders in a reasonable time (<50ms)
    // This will vary by environment but gives a baseline
    expect(renderTime).toBeLessThan(50);
  });

  test('renders efficiently with many genres', () => {
    const bookWithManyGenres = {
      ...mockBook,
      genres: ['Fiction', 'Fantasy', 'Adventure', 'Science Fiction', 'Mystery', 'Thriller', 'Drama', 'Romance', 'Comedy', 'Horror']
    };
    
    // Measure time to render the component with many genres
    const renderTime = measureRenderTime(() => {
      render(<BookCard book={bookWithManyGenres} />);
      cleanup();
    }, 10);
    
    console.log(`BookCard render time (many genres): ${renderTime.toFixed(2)}ms`);
    
    // Check that rendering with many genres doesn't significantly impact performance
    expect(renderTime).toBeLessThan(50);
  });
  
  test('renders efficiently with long description', () => {
    const bookWithLongDescription = {
      ...mockBook,
      description: 'A'.repeat(1000) // 1000 character description
    };
    
    // Measure time to render the component with long description
    const renderTime = measureRenderTime(() => {
      render(<BookCard book={bookWithLongDescription} />);
      cleanup();
    }, 10);
    
    console.log(`BookCard render time (long description): ${renderTime.toFixed(2)}ms`);
    
    // Check that rendering with long description doesn't significantly impact performance
    expect(renderTime).toBeLessThan(50);
  });
});
