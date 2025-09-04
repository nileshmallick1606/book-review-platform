// __tests__/components/BookList.test.tsx
import React from 'react';
import { render, screen, waitFor } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import BookList from '../../components/book/BookList';
import userService from '../../services/userService';
import { Book } from '../../services/bookService';

// Mock BookCard component
jest.mock('../../components/book/BookCard', () => {
  return function MockBookCard(props: { book: Book }) {
    return (
      <div data-testid={`book-card-${props.book.id}`}>
        <h3>{props.book.title}</h3>
        <p>{props.book.author}</p>
      </div>
    );
  };
});

// Mock userService
const mockGetFavorites = jest.fn().mockResolvedValue({
  favorites: [{ id: 'book1' } as any, { id: 'book3' } as any]
});

jest.mock('../../services/userService', () => ({
  getFavorites: () => mockGetFavorites(),
}));

// Mock auth context
const mockUseAuth = jest.fn().mockReturnValue({
  isAuthenticated: true,
  user: { id: 'user123' },
});

jest.mock('../../store/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('BookList Component', () => {
  // Mock books data
  const mockBooks: Book[] = [
    {
      id: 'book1',
      title: 'Book 1',
      author: 'Author 1',
      description: 'Description 1',
      coverImage: 'https://example.com/cover1.jpg',
      genres: ['Fiction'],
      publishedYear: 2021,
      averageRating: 4.5,
      reviewCount: 10,
    },
    {
      id: 'book2',
      title: 'Book 2',
      author: 'Author 2',
      description: 'Description 2',
      coverImage: 'https://example.com/cover2.jpg',
      genres: ['Non-Fiction'],
      publishedYear: 2022,
      averageRating: 4.0,
      reviewCount: 5,
    },
    {
      id: 'book3',
      title: 'Book 3',
      author: 'Author 3',
      description: 'Description 3',
      coverImage: 'https://example.com/cover3.jpg',
      genres: ['Fantasy'],
      publishedYear: 2023,
      averageRating: 4.8,
      reviewCount: 15,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders a list of book cards', async () => {
    render(<BookList books={mockBooks} />);
    
    // Wait for favorites to be loaded
    await waitFor(() => {
      // Verify all books are rendered
      expect(screen.getByTestId('book-card-book1')).toBeTruthy();
      expect(screen.getByTestId('book-card-book2')).toBeTruthy();
      expect(screen.getByTestId('book-card-book3')).toBeTruthy();
    });
  });

  test('shows loading state when isLoading is true', () => {
    render(<BookList books={mockBooks} isLoading={true} />);
    
    // Verify loading message is shown
    expect(screen.getByText('Loading books...')).toBeTruthy();
    
    // Verify book list is not rendered
    expect(screen.queryByTestId('book-card-book1')).toBeNull();
  });

  test('shows error state when error is provided', () => {
    render(<BookList books={mockBooks} error="Failed to load books" />);
    
    // Verify error message is shown
    expect(screen.getByText('Error loading books: Failed to load books')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    
    // Verify book list is not rendered
    expect(screen.queryByTestId('book-card-book1')).toBeNull();
  });

  test('shows empty state message when no books are provided', () => {
    render(<BookList books={[]} />);
    
    // Verify empty state message is shown
    expect(screen.getByText('No books found.')).toBeTruthy();
  });

  test('fetches favorites when component mounts', async () => {
    render(<BookList books={mockBooks} />);
    
    // Wait for favorites to be fetched
    await waitFor(() => {
      expect(mockGetFavorites).toHaveBeenCalled();
    });
  });

  test('does not fetch favorites when not authenticated', async () => {
    // Override the mock to return not authenticated
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: false,
      user: null,
    });
    
    render(<BookList books={mockBooks} />);
    
    // Wait for a moment to ensure any async operations would have happened
    await waitFor(() => {
      expect(mockGetFavorites).not.toHaveBeenCalled();
    });
  });
});
