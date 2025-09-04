// __tests__/components/book/UserFavorites.test.tsx
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import UserFavorites from '../../../components/book/UserFavorites';
import userService from '../../../services/userService';
import { Book } from '../../../types';

// Mock dependencies
jest.mock('../../../components/book/BookCard', () => {
  return function MockBookCard({ book, isFavorite, onFavoriteToggle, inFavoritesTab }) {
    return (
      <div 
        data-testid={`book-card-${book.id}`} 
        className="book-card"
        onClick={() => onFavoriteToggle(book.id, false)}
      >
        {book.title}
        {isFavorite ? ' - Favorite' : ' - Not Favorite'}
        {inFavoritesTab ? ' - In Favorites Tab' : ''}
        <button data-testid={`remove-favorite-${book.id}`}>Remove</button>
      </div>
    );
  };
});

jest.mock('../../../services/userService', () => ({
  getFavorites: jest.fn(),
  removeFavorite: jest.fn()
}));

// Mock book data
const mockFavoriteBooks: Book[] = [
  {
    id: '1',
    title: 'Test Book 1',
    author: 'Author 1',
    description: 'Description 1',
    coverImage: 'cover1.jpg',
    publishedYear: 2020,
    genres: ['Fiction'],
    averageRating: 4.5,
    reviewCount: 10
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
    reviewCount: 5
  }
];

describe('UserFavorites Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state correctly', () => {
    (userService.getFavorites as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<UserFavorites userId="user1" />);
    
    expect(screen.getByText('Loading favorites...')).toBeInTheDocument();
  });

  test('renders error state correctly', async () => {
    const errorMessage = 'Failed to load favorites';
    (userService.getFavorites as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<UserFavorites userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('renders empty state when no favorites exist', async () => {
    (userService.getFavorites as jest.Mock).mockResolvedValue({ favorites: [] });

    render(<UserFavorites userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText("You haven't added any books to your favorites yet.")).toBeInTheDocument();
      expect(screen.getByText("Browse books and click the heart icon to add them to your favorites.")).toBeInTheDocument();
    });
  });

  test('renders favorites correctly', async () => {
    (userService.getFavorites as jest.Mock).mockResolvedValue({ favorites: mockFavoriteBooks });

    render(<UserFavorites userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('My Favorite Books')).toBeInTheDocument();
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('book-card-2')).toBeInTheDocument();
      expect(screen.getByText('Test Book 1 - Favorite - In Favorites Tab')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2 - Favorite - In Favorites Tab')).toBeInTheDocument();
    });
  });

  test('removes book from favorites when unfavorited', async () => {
    (userService.getFavorites as jest.Mock).mockResolvedValue({ favorites: mockFavoriteBooks });
    (userService.removeFavorite as jest.Mock).mockResolvedValue({ success: true });

    render(<UserFavorites userId="user1" />);
    
    // Wait for favorites to load
    await waitFor(() => {
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
    });
    
    // Click on the first book to unfavorite it
    fireEvent.click(screen.getByTestId('book-card-1'));
    
    // Verify that removeFavorite was called
    expect(userService.removeFavorite).toHaveBeenCalledWith('1');
    
    // Verify that the book was removed from the list
    await waitFor(() => {
      expect(screen.queryByTestId('book-card-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('book-card-2')).toBeInTheDocument();
    });
  });

  test('handles error when removing from favorites', async () => {
    (userService.getFavorites as jest.Mock).mockResolvedValue({ favorites: mockFavoriteBooks });
    const errorMessage = 'Failed to remove from favorites';
    (userService.removeFavorite as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<UserFavorites userId="user1" />);
    
    // Wait for favorites to load
    await waitFor(() => {
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
    });
    
    // Click on the first book to unfavorite it
    fireEvent.click(screen.getByTestId('book-card-1'));
    
    // Verify that removeFavorite was called
    expect(userService.removeFavorite).toHaveBeenCalledWith('1');
    
    // Verify that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('refetches favorites when userId changes', async () => {
    (userService.getFavorites as jest.Mock).mockResolvedValue({ favorites: mockFavoriteBooks });

    const { rerender } = render(<UserFavorites userId="user1" />);
    
    await waitFor(() => {
      expect(userService.getFavorites).toHaveBeenCalledWith('user1');
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
    });
    
    // Reset mock and rerender with new userId
    jest.clearAllMocks();
    (userService.getFavorites as jest.Mock).mockResolvedValue({ 
      favorites: [mockFavoriteBooks[1]] 
    });
    
    rerender(<UserFavorites userId="user2" />);
    
    await waitFor(() => {
      expect(userService.getFavorites).toHaveBeenCalledWith('user2');
    });
  });
});
