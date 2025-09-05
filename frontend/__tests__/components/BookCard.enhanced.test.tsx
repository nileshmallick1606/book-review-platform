// // __tests__/components/BookCard.enhanced.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import BookCard from '../../components/book/BookCard';
import { Book } from '../../services/bookService';

// Mock userService methods with the correct types
const mockAddFavorite = jest.fn().mockResolvedValue({ success: true });
const mockRemoveFavorite = jest.fn().mockResolvedValue({ success: true });

jest.mock('../../services/userService', () => ({
  addFavorite: (id: string) => mockAddFavorite(id),
  removeFavorite: (id: string) => mockRemoveFavorite(id),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
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

// Mock auth context
const mockUseAuth = jest.fn();
jest.mock('../../store/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('BookCard Component - Enhanced Tests', () => {
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
    
    // Add style for hover simulation
    document.head.innerHTML = `
      <style>
        .book-card-image:hover .favorite-button {
          opacity: 1;
        }
      </style>
    `;
  });

  // Test 1: Hover state for favorite button
  test('shows favorite button on hover', async () => {
    const { container } = render(<BookCard book={mockBook} />);
    
    // Get the book card image container
    const bookCardImage = container.querySelector('.book-card-image');
    expect(bookCardImage).not.toBeNull();
    
    // Get the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    
    // Apply hover effect programmatically
    if (bookCardImage) {
      fireEvent.mouseEnter(bookCardImage);
      
      // Check if button is now visible
      // In a real browser, this would change the opacity, but in JSDOM we can
      // only verify the element exists
      expect(favoriteButton).toBeTruthy();
      
      // And test the reverse
      fireEvent.mouseLeave(bookCardImage);
    }
  });

  // Test 2: Test adding to favorites with hover
  test('adds book to favorites when button is clicked', async () => {
    const mockOnFavoriteToggle = jest.fn();
    
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={false} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    expect(favoriteButton).toBeTruthy();
    
    // Click the favorite button
    fireEvent.click(favoriteButton);
    
    // Check if the service was called
    await waitFor(() => {
      expect(mockAddFavorite).toHaveBeenCalledWith(mockBook.id);
      expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, true);
    });
  });

  // Test 3: Test removing from favorites with hover
  test('removes book from favorites when button is clicked', async () => {
    const mockOnFavoriteToggle = jest.fn();
    
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={true} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    expect(favoriteButton).toBeTruthy();
    
    // Click the favorite button
    fireEvent.click(favoriteButton);
    
    // Check if the service was called
    await waitFor(() => {
      expect(mockRemoveFavorite).toHaveBeenCalledWith(mockBook.id);
      expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, false);
    });
  });

  // Test 4: Test error handling when adding favorite fails
  test('handles error when favorite toggle fails', async () => {
    // Mock console.error to prevent error from showing in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock service to reject
    mockAddFavorite.mockImplementationOnce(() => Promise.reject(new Error('Failed to add favorite')));
    
    const mockOnFavoriteToggle = jest.fn();
    
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={false} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    
    // Click the favorite button
    fireEvent.click(favoriteButton);
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to toggle favorite:', expect.any(Error));
      
      // Verify the favorite toggle callback was not called (error case)
      expect(mockOnFavoriteToggle).not.toHaveBeenCalled();
    });
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  // Test 5: Test behavior when not authenticated
  test('does not show favorite button when user is not authenticated', () => {
    // Mock auth to return unauthenticated
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: false,
      user: null,
    });
    
    const { container } = render(<BookCard book={mockBook} />);
    
    // Should not find the favorite button
    const favoriteButton = container.querySelector('.favorite-button');
    expect(favoriteButton).toBeNull();
  });

  // Test 6: Test behavior when in favorites tab
  test('shows remove option when in favorites tab', () => {
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={true} 
        inFavoritesTab={true} 
      />
    );
    
    // Should find the remove label
    const removeLabel = screen.getByText('Remove');
    expect(removeLabel).toBeTruthy();
  });

  // Test 7: Test book with minimal description
  test('renders book with minimal description correctly', () => {
    const minimalBook = {
      ...mockBook,
      description: 'Short desc',
    };
    
    render(<BookCard book={minimalBook} />);
    
    // Check that the description is rendered without ellipsis
    const shortDesc = screen.getByText('Short desc');
    expect(shortDesc).toBeTruthy();
  });

  // Test 8: Test book without any description
  test('renders book without description correctly', () => {
    const noDescBook = {
      ...mockBook,
      description: '',
    };
    
    const { container } = render(<BookCard book={noDescBook} />);
    
    // Check that an empty description is handled gracefully
    const descriptionElement = container.querySelector('.book-description');
    expect(descriptionElement?.textContent).toBe('');
  });

  // Test 9: Test processing state during favorite toggle
  test('shows processing state during favorite toggle', async () => {
    // Create a delayed promise to simulate processing
    mockAddFavorite.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      });
    });
    
    const { container } = render(<BookCard book={mockBook} />);
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    
    // Click the button
    fireEvent.click(favoriteButton);
    
    // Check for processing class/indicator immediately after click
    expect(favoriteButton.classList.contains('processing')).toBe(true);
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(mockAddFavorite).toHaveBeenCalled();
    }, { timeout: 150 });
  });

  // Test 10: Test with single genre
  test('renders book with a single genre correctly', () => {
    const singleGenreBook = {
      ...mockBook,
      genres: ['Fiction'],
    };
    
    render(<BookCard book={singleGenreBook} />);
    
    // Should show one genre tag and no +more indicator
    const genreTag = screen.getByText('Fiction');
    expect(genreTag).toBeTruthy();
    
    // Should not have +more indicator
    const moreIndicator = screen.queryByText('+');
    expect(moreIndicator).toBeNull();
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import BookCard from '../../components/book/BookCard';
import { Book } from '../../services/bookService';

// Mock userService methods
const mockAddFavorite = jest.fn().mockResolvedValue({ success: true });
const mockRemoveFavorite = jest.fn().mockResolvedValue({ success: true });

jest.mock('../../services/userService', () => ({
  addFavorite: mockAddFavorite,
  removeFavorite: mockRemoveFavorite,
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
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

// Mock auth context
const mockUseAuth = jest.fn();
jest.mock('../../store/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('BookCard Component - Enhanced Tests', () => {
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
    
    // Add style for hover simulation
    document.head.innerHTML = `
      <style>
        .book-card-image:hover .favorite-button {
          opacity: 1;
        }
      </style>
    `;
  });

  // Test 1: Hover state for favorite button
  test('shows favorite button on hover', async () => {
    const { container } = render(<BookCard book={mockBook} />);
    
    // Get the book card image container
    const bookCardImage = container.querySelector('.book-card-image');
    expect(bookCardImage).not.toBeNull();
    
    // Get the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    
    // Apply hover effect programmatically
    if (bookCardImage) {
      fireEvent.mouseEnter(bookCardImage);
      
      // Check if button is now visible
      // In a real browser, this would change the opacity, but in JSDOM we can
      // only verify the element exists in the DOM
      expect(favoriteButton).toBeInTheDocument();
      
      // And test the reverse
      fireEvent.mouseLeave(bookCardImage);
    }
  });

  // Test 2: Test adding to favorites with hover
  test('adds book to favorites when button is clicked', async () => {
    const mockOnFavoriteToggle = jest.fn();
    
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={false} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    expect(favoriteButton).toBeInTheDocument();
    
    // Click the favorite button
    fireEvent.click(favoriteButton);
    
    // Check if the service was called
    await waitFor(() => {
      expect(mockAddFavorite).toHaveBeenCalledWith(mockBook.id);
      expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, true);
    });
  });

  // Test 3: Test removing from favorites with hover
  test('removes book from favorites when button is clicked', async () => {
    const mockOnFavoriteToggle = jest.fn();
    
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={true} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    expect(favoriteButton).toBeInTheDocument();
    
    // Click the favorite button
    fireEvent.click(favoriteButton);
    
    // Check if the service was called
    await waitFor(() => {
      expect(mockRemoveFavorite).toHaveBeenCalledWith(mockBook.id);
      expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockBook.id, false);
    });
  });

  // Test 4: Test error handling when adding favorite fails
  test('handles error when favorite toggle fails', async () => {
    // Mock console.error to prevent error from showing in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock service to reject
    mockAddFavorite.mockRejectedValueOnce(new Error('Failed to add favorite'));
    
    const mockOnFavoriteToggle = jest.fn();
    
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={false} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    
    // Click the favorite button
    fireEvent.click(favoriteButton);
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to toggle favorite:', expect.any(Error));
      
      // Verify the favorite toggle callback was not called (error case)
      expect(mockOnFavoriteToggle).not.toHaveBeenCalled();
    });
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  // Test 5: Test behavior when not authenticated
  test('does not show favorite button when user is not authenticated', () => {
    // Mock auth to return unauthenticated
    mockUseAuth.mockReturnValueOnce({
      isAuthenticated: false,
      user: null,
    });
    
    const { container } = render(<BookCard book={mockBook} />);
    
    // Should not find the favorite button
    const favoriteButton = container.querySelector('.favorite-button');
    expect(favoriteButton).toBeNull();
  });

  // Test 6: Test behavior when in favorites tab
  test('shows remove option when in favorites tab', () => {
    const { container } = render(
      <BookCard 
        book={mockBook} 
        isFavorite={true} 
        inFavoritesTab={true} 
      />
    );
    
    // Should find the remove label
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  // Test 7: Test book with minimal description
  test('renders book with minimal description correctly', () => {
    const minimalBook = {
      ...mockBook,
      description: 'Short desc',
    };
    
    render(<BookCard book={minimalBook} />);
    
    // Check that the description is rendered without ellipsis
    expect(screen.getByText('Short desc')).toBeInTheDocument();
  });

  // Test 8: Test book without any description
  test('renders book without description correctly', () => {
    const noDescBook = {
      ...mockBook,
      description: '',
    };
    
    render(<BookCard book={noDescBook} />);
    
    // Check that an empty description is handled gracefully
    const descriptionElement = container.querySelector('.book-description');
    expect(descriptionElement?.textContent).toBe('');
  });

  // Test 9: Test processing state during favorite toggle
  test('shows processing state during favorite toggle', async () => {
    // Create a delayed promise to simulate processing
    mockAddFavorite.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      });
    });
    
    const { container } = render(<BookCard book={mockBook} />);
    
    // Find the favorite button
    const favoriteButton = screen.getByTestId(`favorite-button-${mockBook.id}`);
    
    // Click the button
    fireEvent.click(favoriteButton);
    
    // Check for processing class/indicator immediately after click
    expect(favoriteButton.classList.contains('processing')).toBe(true);
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(mockAddFavorite).toHaveBeenCalled();
    }, { timeout: 150 });
  });

  // Test 10: Test with single genre
  test('renders book with a single genre correctly', () => {
    const singleGenreBook = {
      ...mockBook,
      genres: ['Fiction'],
    };
    
    render(<BookCard book={singleGenreBook} />);
    
    // Should show one genre tag and no +more indicator
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    
    // Should not have +more indicator
    const moreIndicator = screen.queryByText('+');
    expect(moreIndicator).toBeNull();
  });
});
