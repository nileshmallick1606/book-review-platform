import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookCardTestPage from '../../pages/book-cards-test';
import { useAuth } from '../../store';

// Mock next/head to avoid test warnings
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

// Mock Layout component
jest.mock('../../components/layout/Layout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="layout">{children}</div>;
    },
  };
});

// Mock BookCard component
jest.mock('../../components/book/BookCard', () => {
  return {
    __esModule: true,
    default: ({ book, isFavorite, onFavoriteToggle }: any) => {
      return (
        <div data-testid="book-card">
          <h3>{book.title}</h3>
          <button 
            data-testid="favorite-button"
            onClick={() => onFavoriteToggle(book.id, !isFavorite)}
          >
            {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>
        </div>
      );
    },
  };
});

// Mock RecommendationCard component
jest.mock('../../components/recommendation/RecommendationCard', () => {
  return {
    __esModule: true,
    default: ({ recommendation, isFavorite, onFavoriteToggle }: any) => {
      return (
        <div data-testid="recommendation-card">
          <h3>{recommendation.title}</h3>
          <button 
            data-testid="recommendation-favorite-button"
            onClick={() => onFavoriteToggle(recommendation.id, !isFavorite)}
          >
            {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>
        </div>
      );
    },
  };
});

// Mock useAuth
jest.mock('../../store', () => ({
  useAuth: jest.fn().mockReturnValue({
    isAuthenticated: true,
    user: { id: 'user1', name: 'Test User' },
  }),
}));

describe('BookCardTestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  test('renders the page title', () => {
    render(<BookCardTestPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Book Cards Consistency Test' })).toBeInTheDocument();
  });

  test('renders the standard book card section', () => {
    render(<BookCardTestPage />);
    expect(screen.getByText('Standard Book Card')).toBeInTheDocument();
    expect(screen.getByTestId('book-card')).toBeInTheDocument();
  });

  test('renders the recommendation card section', () => {
    render(<BookCardTestPage />);
    expect(screen.getByText('Recommendation Card (using BookCard)')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-card')).toBeInTheDocument();
  });

  test('handles favorite toggle for book card', () => {
    render(<BookCardTestPage />);
    
    // Initially not a favorite
    const favoriteButton = screen.getByTestId('favorite-button');
    expect(favoriteButton.textContent).toBe('Add to favorites');
    
    // Toggle favorite
    fireEvent.click(favoriteButton);
    
    // Verify console.log was called with the right arguments
    expect(console.log).toHaveBeenCalledWith('Book sample-1 favorite status changed to: true');
    
    // Button text should now reflect favorite status
    expect(favoriteButton.textContent).toBe('Remove from favorites');
    
    // Toggle favorite again
    fireEvent.click(favoriteButton);
    
    // Verify console.log was called with the updated status
    expect(console.log).toHaveBeenCalledWith('Book sample-1 favorite status changed to: false');
    
    // Button text should reflect non-favorite status
    expect(favoriteButton.textContent).toBe('Add to favorites');
  });

  test('handles favorite toggle for recommendation card', () => {
    render(<BookCardTestPage />);
    
    // Initially not a favorite
    const favoriteButton = screen.getByTestId('recommendation-favorite-button');
    expect(favoriteButton.textContent).toBe('Add to favorites');
    
    // Toggle favorite
    fireEvent.click(favoriteButton);
    
    // Verify console.log was called with the right arguments
    expect(console.log).toHaveBeenCalledWith('Book rec-1 favorite status changed to: true');
    
    // Button text should now reflect favorite status
    expect(favoriteButton.textContent).toBe('Remove from favorites');
  });
});
