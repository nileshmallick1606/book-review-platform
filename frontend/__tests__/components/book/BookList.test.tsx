// __tests__/components/book/BookList.test.tsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import BookList from '../../../components/book/BookList';
import { useAuth } from '../../../store/auth-context';
import userService from '../../../services/userService';
import { Book } from '../../../services/bookService';

// Mock dependencies
jest.mock('../../../components/book/BookCard', () => {
  return function MockBookCard({ book, isFavorite, onFavoriteToggle }: { 
    book: any, 
    isFavorite: boolean, 
    onFavoriteToggle: (bookId: string, isFavorite: boolean) => void 
  }) {
    return (
      <div data-testid={`book-card-${book.id}`} onClick={() => onFavoriteToggle(book.id, !isFavorite)}>
        {book.title} - {isFavorite ? 'Favorite' : 'Not Favorite'}
      </div>
    );
  };
});

jest.mock('../../../store/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/userService', () => ({
  getFavorites: jest.fn(),
}));

// Test data
const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Test Book 1',
    author: 'Author 1',
    description: 'Description 1',
    coverImage: 'cover1.jpg',
    publishedYear: 2020,
    genres: ['Fiction'],
    averageRating: 4.5,
    reviewCount: 10,
  },
  {
    id: '2',
    title: 'Test Book 2',
    author: 'Author 2',
    description: 'Description 2',
    coverImage: 'cover2.jpg',
    publishedYear: 2021,
    genres: ['Non-Fiction'],
    averageRating: 3.8,
    reviewCount: 5,
  },
];

const mockFavorites = [
  {
    id: '1',
    title: 'Test Book 1',
    author: 'Author 1',
    description: 'Description 1',
    coverImage: 'cover1.jpg',
    publishedYear: 2020,
    genres: ['Fiction'],
    averageRating: 4.5,
    reviewCount: 10,
  }
];

describe('BookList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders loading state correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    
    render(<BookList books={[]} isLoading={true} />);
    
    expect(screen.getByText('Loading books...')).toBeInTheDocument();
    const spinner = document.querySelector('.spinner');
    expect(spinner).not.toBeNull();
  });

  test('renders error state correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    
    render(<BookList books={[]} error="Failed to load books" />);
    
    expect(screen.getByText('Error loading books: Failed to load books')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('renders empty state when no books are provided', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    
    render(<BookList books={[]} />);
    
    expect(screen.getByText('No books found.')).toBeInTheDocument();
  });

  test('renders books correctly when unauthenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    
    render(<BookList books={mockBooks} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('book-card-2')).toBeInTheDocument();
      expect(screen.getByText('Test Book 1 - Not Favorite')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2 - Not Favorite')).toBeInTheDocument();
    });
    
    expect(userService.getFavorites).not.toHaveBeenCalled();
  });

  test('fetches and renders favorites correctly when authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true, 
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' } 
    });
    
    (userService.getFavorites as jest.Mock).mockResolvedValue({
      favorites: mockFavorites
    });
    
    render(<BookList books={mockBooks} />);
    
    await waitFor(() => {
      expect(userService.getFavorites).toHaveBeenCalledWith('user1');
      expect(screen.getByText('Test Book 1 - Favorite')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2 - Not Favorite')).toBeInTheDocument();
    });
  });

  test('handles errors when fetching favorites', async () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true, 
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' } 
    });
    
    const mockError = new Error('Failed to fetch favorites');
    (userService.getFavorites as jest.Mock).mockRejectedValue(mockError);
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<BookList books={mockBooks} />);
    
    await waitFor(() => {
      expect(userService.getFavorites).toHaveBeenCalledWith('user1');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch favorites:', mockError);
    });
    
    // Books should still render without favorites
    expect(screen.getByText('Test Book 1 - Not Favorite')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2 - Not Favorite')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  test('handles favorite toggle correctly', async () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true, 
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' } 
    });
    
    (userService.getFavorites as jest.Mock).mockResolvedValueOnce({
      favorites: mockFavorites
    }).mockResolvedValueOnce({
      favorites: [...mockFavorites, mockBooks[1]]
    });
    
    render(<BookList books={mockBooks} />);
    
    // Wait for initial render with favorites
    await waitFor(() => {
      expect(screen.getByText('Test Book 1 - Favorite')).toBeInTheDocument();
    });
    
    // Toggle favorite for book 2
    act(() => {
      screen.getByTestId('book-card-2').click();
    });
    
    // Book should be marked as favorite immediately (optimistic update)
    expect(screen.getByText('Test Book 2 - Favorite')).toBeInTheDocument();
    
    // Fast-forward timer to trigger the refresh
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Wait for the second call to getFavorites after the refresh
    await waitFor(() => {
      expect(userService.getFavorites).toHaveBeenCalledTimes(2);
    });
  });

  test('handles unfavoriting a book correctly', async () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true, 
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' } 
    });
    
    (userService.getFavorites as jest.Mock).mockResolvedValueOnce({
      favorites: mockFavorites
    }).mockResolvedValueOnce({
      favorites: []
    });
    
    render(<BookList books={mockBooks} />);
    
    // Wait for initial render with favorites
    await waitFor(() => {
      expect(screen.getByText('Test Book 1 - Favorite')).toBeInTheDocument();
    });
    
    // Unfavorite book 1
    act(() => {
      screen.getByTestId('book-card-1').click();
    });
    
    // Book should be unmarked as favorite immediately (optimistic update)
    expect(screen.getByText('Test Book 1 - Not Favorite')).toBeInTheDocument();
    
    // Fast-forward timer to trigger the refresh
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Wait for the second call to getFavorites after the refresh
    await waitFor(() => {
      expect(userService.getFavorites).toHaveBeenCalledTimes(2);
    });
  });
});
