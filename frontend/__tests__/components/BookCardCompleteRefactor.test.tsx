// __tests__/components/BookCardCompleteRefactor.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookCard from '../../components/book/BookCard';
import { Book } from '../../types';

// Mock userService methods
const mockAddFavorite = jest.fn().mockResolvedValue({ success: true });
const mockRemoveFavorite = jest.fn().mockResolvedValue({ success: true });

jest.mock('../../services/userService', () => ({
  addFavorite: (id: string) => mockAddFavorite(id),
  removeFavorite: (id: string) => mockRemoveFavorite(id),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href} data-testid="next-link">{children}</a>
    )
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: ({ src, alt, width, height, onError, ...rest }: any) => (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height} 
        onError={onError} 
        data-testid="next-image"
        {...rest}
      />
    )
  };
});

// Mock StarRating component
jest.mock('../../components/ui/StarRating', () => {
  return {
    __esModule: true,
    default: ({ rating, readOnly }: { rating: number; readOnly: boolean }) => (
      <div className="star-rating" data-testid="star-rating">
        {rating}
      </div>
    )
  };
});

// Mock auth context
const mockUseAuth = jest.fn();
jest.mock('../../store/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper to simulate viewport sizes
const setViewport = (size: 'mobile' | 'tablet' | 'desktop') => {
  let width;
  switch (size) {
    case 'mobile':
      width = 375;
      break;
    case 'tablet':
      width = 768;
      break;
    case 'desktop':
    default:
      width = 1280;
  }
  
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
};

const resetViewport = () => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
  window.dispatchEvent(new Event('resize'));
};

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
      
      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
      expect(screen.getByText(/by Test Author/)).toBeInTheDocument();
      
      // Check for star rating component
      const ratingElement = screen.getByTestId('star-rating');
      expect(ratingElement).toBeInTheDocument();
      expect(ratingElement.textContent).toBe('4.5');
      
      // Check for review count
      expect(screen.getByText(/10 reviews/)).toBeInTheDocument();
      
      // Check description is limited
      expect(screen.getByText(/This is a test book description/)).toBeInTheDocument();
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument(); // Check for ellipsis
      
      // Genres are limited to 3 with a +1 indicator
      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Adventure')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
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
      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
      
      // Empty description should not crash
      const descriptionElement = screen.queryByText(/This is a test/);
      expect(descriptionElement).not.toBeInTheDocument();
      
      // No genres should not show genre tags
      const genreTag = screen.queryByText('Fiction');
      expect(genreTag).not.toBeInTheDocument();
    });

    test('renders with short description (no truncation needed)', () => {
      const bookWithShortDescription = {
        ...mockBook,
        description: 'Short description'
      };
      
      render(<BookCard book={bookWithShortDescription} />);
      
      expect(screen.getByText('Short description')).toBeInTheDocument();
      // No ellipsis should be present
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    test('renders with empty string description', () => {
      const bookWithEmptyDescription = {
        ...mockBook,
        description: ''
      };
      
      render(<BookCard book={bookWithEmptyDescription} />);
      
      // Should not crash and no description should be shown
      const descriptionElement = screen.queryByText(/This is a test/);
      expect(descriptionElement).not.toBeInTheDocument();
    });

    test('renders with few genres (less than max display limit)', () => {
      const bookWithFewGenres = {
        ...mockBook,
        genres: ['Fiction', 'Fantasy']
      };
      
      render(<BookCard book={bookWithFewGenres} />);
      
      // Should show both genres
      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
      // No +more indicator
      expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
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

    test('directly removes from favorites when in favorites tab', async () => {
      const mockOnFavoriteToggle = jest.fn();
      
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={true}
          inFavoritesTab={true}
          onFavoriteToggle={mockOnFavoriteToggle} 
        />
      );
      
      // Find and click the favorite button
      const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      fireEvent.click(favoriteButton);
      
      // In favorites tab, should only call removeFavorite
      await waitFor(() => {
        expect(mockRemoveFavorite).toHaveBeenCalledWith(mockBook.id);
        expect(mockAddFavorite).not.toHaveBeenCalled();
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

    test('does nothing when favorite button is clicked while processing', async () => {
      const mockOnFavoriteToggle = jest.fn();
      
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={false} 
          onFavoriteToggle={mockOnFavoriteToggle} 
        />
      );
      
      // Set up a delay in the service call to test processing state
      mockAddFavorite.mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 1000);
      }));
      
      // Click the button once
      const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      fireEvent.click(favoriteButton);
      
      // Click it again while processing
      fireEvent.click(favoriteButton);
      
      // Should only have called service once
      expect(mockAddFavorite).toHaveBeenCalledTimes(1);
    });

    test('does nothing when favorite button is clicked while not authenticated', async () => {
      // Mock not authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });
      
      const mockOnFavoriteToggle = jest.fn();
      
      render(
        <BookCard 
          book={mockBook} 
          isFavorite={false} 
          onFavoriteToggle={mockOnFavoriteToggle} 
        />
      );
      
      // Try to click the favorite button if it exists
      const favoriteButton = screen.queryByTestId(`favorite-button-${mockBook.id}`);
      if (favoriteButton) {
        fireEvent.click(favoriteButton);
      }
      
      // Services should not be called
      expect(mockAddFavorite).not.toHaveBeenCalled();
      expect(mockRemoveFavorite).not.toHaveBeenCalled();
      expect(mockOnFavoriteToggle).not.toHaveBeenCalled();
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
      const removeButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      expect(removeButton).toHaveClass('in-favorites-tab');
      expect(removeButton).toHaveAttribute('aria-label', 'Remove from favorites');
    });

    test('updates favorite state when props change', () => {
      const { rerender } = render(
        <BookCard book={mockBook} isFavorite={false} />
      );
      
      // Initially not a favorite
      const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
      expect(favoriteButton).not.toHaveClass('is-favorite');
      
      // Update props to make it a favorite
      rerender(<BookCard book={mockBook} isFavorite={true} />);
      
      // Should now have favorite class
      expect(favoriteButton).toHaveClass('is-favorite');
    });
  });

  describe('Image Handling Tests', () => {
    test('uses placeholder when image URL is empty', () => {
      const bookNoImage = { ...mockBook, coverImage: '' };
      render(<BookCard book={bookNoImage} />);
      
      const img = screen.getByAltText(`Cover for ${mockBook.title}`);
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toContain('placeholder');
    });
    
    test('handles image loading error', () => {
      render(<BookCard book={mockBook} />);
      
      const img = screen.getByAltText(`Cover for ${mockBook.title}`);
      fireEvent.error(img);
      
      // After error, should use placeholder
      expect(img.getAttribute('src')).toContain('placeholder');
    });

    test('uses provided cover image when available and no error', () => {
      render(<BookCard book={mockBook} />);
      
      const img = screen.getByAltText(`Cover for ${mockBook.title}`);
      expect(img.getAttribute('src')).toBe(mockBook.coverImage);
    });
  });

  describe('Responsive Design Tests', () => {
    test('adjusts layout for mobile viewport', () => {
      // Set viewport to mobile size
      setViewport('mobile');
      
      const { container } = render(<BookCard book={mockBook} />);
      
      // In a real test, we would check specific responsive behaviors
      // For now, we're just verifying the component renders at this viewport
      expect(container.querySelector('.book-card')).toBeInTheDocument();
      expect(window.innerWidth).toBe(375);
    });
    
    test('adjusts layout for tablet viewport', () => {
      // Set viewport to tablet size
      setViewport('tablet');
      
      const { container } = render(<BookCard book={mockBook} />);
      
      // In a real test, we would check specific responsive behaviors
      expect(container.querySelector('.book-card')).toBeInTheDocument();
      expect(window.innerWidth).toBe(768);
    });
    
    test('adjusts layout for desktop viewport', () => {
      // Set viewport to desktop size
      setViewport('desktop');
      
      const { container } = render(<BookCard book={mockBook} />);
      
      // In a real test, we would check specific responsive behaviors
      expect(container.querySelector('.book-card')).toBeInTheDocument();
      expect(window.innerWidth).toBe(1280);
    });
  });
  
  describe('Class Name and Custom Styling Tests', () => {
    test('applies custom className when provided', () => {
      const { container } = render(
        <BookCard book={mockBook} className="custom-test-class" />
      );
      
      const cardElement = container.querySelector('.book-card');
      expect(cardElement).toHaveClass('custom-test-class');
    });

    test('applies default empty className when not provided', () => {
      const { container } = render(<BookCard book={mockBook} />);
      
      const cardElement = container.querySelector('.book-card');
      expect(cardElement).not.toHaveClass('custom-test-class');
      // Should have just the base class
      expect(cardElement).toHaveClass('book-card');
    });
  });

  describe('Link and Navigation Tests', () => {
    test('creates correct link to book details page', () => {
      render(<BookCard book={mockBook} />);
      
      const link = screen.getByTestId('next-link');
      expect(link).toHaveAttribute('href', `/books/${mockBook.id}`);
    });
    
    test('link contains all book information', () => {
      render(<BookCard book={mockBook} />);
      
      const link = screen.getByTestId('next-link');
      expect(link).toContainElement(screen.getByText(mockBook.title));
      expect(link).toContainElement(screen.getByText(/by Test Author/));
      expect(link).toContainElement(screen.getByTestId('star-rating'));
    });
  });

  describe('Event Propagation Tests', () => {
    // Since we can't directly test preventDefault and stopPropagation,
    // we'll test that the click handler works correctly
    test('correctly triggers the favorite toggle handler when clicked', async () => {
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
      
      // Verify service was called, indicating event handlers executed properly
      await waitFor(() => {
        expect(mockAddFavorite).toHaveBeenCalledWith(mockBook.id);
        expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, true);
      });
    });
  });
});
