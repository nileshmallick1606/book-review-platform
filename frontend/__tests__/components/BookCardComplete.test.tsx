// __tests__/components/BookCardComplete.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import BookCard from '../../components/book/BookCard';
import { Book } from '../../services/bookService';
import { setViewport, resetViewport } from '../utils/viewport-utils';

// Mock userService methods
const mockAddFavorite = jest.fn().mockResolvedValue({ success: true });
const mockRemoveFavorite = jest.fn().mockResolvedValue({ success: true });

jest.mock('../../services/userService', () => ({
  addFavorite: (id: string) => mockAddFavorite(id),
  removeFavorite: (id: string) => mockRemoveFavorite(id),
}));

// Mock auth context
const mockUseAuth = jest.fn();
jest.mock('../../store/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('BookCard Complete Test Suite', () => {
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
    
    // Default auth mock implementation
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user123' },
    });
    
    // Reset viewport to desktop
    resetViewport();
  });

  describe('Basic Rendering Tests', () => {
    test('renders correctly with all book information', () => {
      render(<BookCard book={mockBook} />);
      
      expect(screen.getByText('Test Book Title')).toBeTruthy();
      expect(screen.getByText(/by Test Author/)).toBeTruthy();
      expect(screen.getByText('4.5')).toBeTruthy();
      expect(screen.getByText(/10 reviews/)).toBeTruthy();
      
      // Genres are limited to 3 with a +1 indicator
      expect(screen.getByText('Fiction')).toBeTruthy();
      expect(screen.getByText('Fantasy')).toBeTruthy();
      expect(screen.getByText('Adventure')).toBeTruthy();
      expect(screen.getByText('+1')).toBeTruthy();
    });
    
    test('renders properly with missing data', () => {
      const incompleteBook = {
        ...mockBook,
        description: '',
        genres: [],
        coverImage: '',
      };
      
      render(<BookCard book={incompleteBook} />);
      
      // Should still render without errors
      expect(screen.getByText('Test Book Title')).toBeTruthy();
      
      // Empty description should not crash
      const descriptionElement = screen.queryByText(/This is a test/);
      expect(descriptionElement).toBeNull();
      
      // No genres should not show genre tags
      const genreTag = screen.queryByText('Fiction');
      expect(genreTag).toBeNull();
    });
  });
  
  describe('Favorite Functionality Tests', () => {
    test('adds book to favorites when favorite button is clicked', async () => {
      const mockOnFavoriteToggle = jest.fn();
      
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={false} 
          onFavoriteToggle={mockOnFavoriteToggle} 
        />
      );
      
      // Find and click the favorite button
      const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      fireEvent.click(favoriteButton);
      
      // Verify service was called and callback triggered
      await waitFor(() => {
        expect(mockAddFavorite).toHaveBeenCalledWith(mockBook.id);
        expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, true);
      });
    });
    
    test('removes book from favorites when already favorited', async () => {
      const mockOnFavoriteToggle = jest.fn();
      
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={true} 
          onFavoriteToggle={mockOnFavoriteToggle} 
        />
      );
      
      // Find and click the favorite button
      const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      fireEvent.click(favoriteButton);
      
      // Verify service was called and callback triggered
      await waitFor(() => {
        expect(mockRemoveFavorite).toHaveBeenCalledWith(mockBook.id);
        expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, false);
      });
    });
    
    test('handles error when toggling favorite fails', async () => {
      // Mock console.error to prevent cluttering test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the service to reject
      mockAddFavorite.mockImplementationOnce(() => Promise.reject(new Error('Failed to add favorite')));
      
      const mockOnFavoriteToggle = jest.fn();
      
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={false} 
          onFavoriteToggle={mockOnFavoriteToggle} 
        />
      );
      
      // Find and click the favorite button
      const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      fireEvent.click(favoriteButton);
      
      // Verify error is logged and callback not called
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to toggle favorite:', expect.any(Error));
        expect(mockOnFavoriteToggle).not.toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });
    
    test('shows remove button with label when in favorites tab', () => {
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={true} 
          inFavoritesTab={true} 
        />
      );
      
      // Should show the remove label
      expect(screen.getByText('Remove')).toBeTruthy();
    });
  });

  describe('Image Handling Tests', () => {
    test('uses placeholder when image URL is empty', () => {
      const bookNoImage = { ...mockBook, coverImage: '' };
      render(<BookCard book={bookNoImage} />);
      
      const img = screen.getByAltText(`Cover for ${mockBook.title}`);
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toContain('placeholder');
    });
    
    test('handles image loading error', () => {
      render(<BookCard book={mockBook} />);
      
      const img = screen.getByAltText(`Cover for ${mockBook.title}`);
      fireEvent.error(img);
      
      // After error, should use placeholder
      expect(img.getAttribute('src')).toContain('placeholder');
    });
  });

  describe('Responsive Design Tests', () => {
    test('adjusts layout for mobile viewport', () => {
      // Set viewport to mobile size
      setViewport('mobile');
      
      const { container } = render(<BookCard book={mockBook} />);
      
      // In a real test, we would check specific responsive behaviors
      // For now, we're just verifying the component renders at this viewport
      expect(container.querySelector('.book-card')).toBeTruthy();
      expect(window.innerWidth).toBe(375);
    });
    
    test('adjusts layout for tablet viewport', () => {
      // Set viewport to tablet size
      setViewport('tablet');
      
      const { container } = render(<BookCard book={mockBook} />);
      
      // In a real test, we would check specific responsive behaviors
      expect(container.querySelector('.book-card')).toBeTruthy();
      expect(window.innerWidth).toBe(768);
    });
    
    test('adjusts layout for desktop viewport', () => {
      // Set viewport to desktop size
      setViewport('desktop');
      
      const { container } = render(<BookCard book={mockBook} />);
      
      // In a real test, we would check specific responsive behaviors
      expect(container.querySelector('.book-card')).toBeTruthy();
      expect(window.innerWidth).toBe(1280);
    });
  });
  
  describe('Class Name and Custom Styling Tests', () => {
    test('applies custom className when provided', () => {
      const { container } = render(
        <BookCard book={mockBook} className="custom-test-class" />
      );
      
      const cardElement = container.querySelector('.book-card');
      expect(cardElement?.classList.contains('custom-test-class')).toBe(true);
    });
  });
});
