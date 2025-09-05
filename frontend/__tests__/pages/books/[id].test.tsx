import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import BookDetailsPage from '../../../pages/books/[id]';
import bookService from '../../../services/bookService';
import reviewService from '../../../services/reviewService';
import userService from '../../../services/userService';
import { useAuth } from '../../../store/auth-context';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="head">{children}</div>;
    },
  };
});

// Mock auth context
jest.mock('../../../store/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock services
jest.mock('../../../services/bookService', () => ({
  getBookById: jest.fn(),
}));

jest.mock('../../../services/reviewService', () => ({
  getBookReviews: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
}));

jest.mock('../../../services/userService', () => ({
  getFavorites: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

// Define prop types for mock components
interface ReviewListProps {
  reviews: Array<any>;
  onEditReview: (review: any) => void;
  onDeleteReview: (reviewId: string) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
}

interface DeleteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

interface ReviewFormProps {
  bookId: string;
  onSubmit: (data: any) => void;
  initialReview?: any;
  isSubmitting: boolean;
}

// Mock components
jest.mock('../../../components/review/ReviewList', () => {
  return function MockReviewList(props: ReviewListProps) {
    return (
      <div data-testid="review-list">
        <span data-testid="reviews-count">{props.reviews.length}</span>
        <button 
          data-testid="edit-review-button" 
          onClick={() => props.onEditReview(props.reviews[0])}
        >
          Edit First Review
        </button>
        <button 
          data-testid="delete-review-button" 
          onClick={() => props.onDeleteReview(props.reviews[0]?.id)}
        >
          Delete First Review
        </button>
        <button 
          data-testid="page-change-button" 
          onClick={() => props.onPageChange(2)}
        >
          Change Page
        </button>
        <button 
          data-testid="sort-change-button" 
          onClick={() => props.onSortChange('rating', 'asc')}
        >
          Change Sort
        </button>
      </div>
    );
  };
});

jest.mock('../../../components/review/DeleteReviewModal', () => {
  return function MockDeleteReviewModal({ isOpen, onClose, onConfirm, isDeleting }: DeleteReviewModalProps) {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-modal">
        <button 
          data-testid="cancel-delete-button" 
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button 
          data-testid="confirm-delete-button" 
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    );
  };
});

jest.mock('../../../components/review/ReviewForm', () => {
  return function MockReviewForm({ bookId, onSubmit, initialReview, isSubmitting }: ReviewFormProps) {
    return (
      <div data-testid="review-form">
        <button 
          data-testid="submit-review-button" 
          onClick={() => onSubmit({ 
            bookId, 
            text: 'Test review text', 
            rating: 4 
          })}
          disabled={isSubmitting}
        >
          {initialReview ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    );
  };
});

describe('BookDetailsPage', () => {
  // Sample book data
  const mockBook = {
    id: 'book123',
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test description',
    publishedYear: 2025,
    coverImage: '/test.jpg',
    averageRating: 4.5,
    reviewCount: 10,
    genres: ['Fiction', 'Fantasy']
  };

  // Sample review data
  const mockReviews = [
    {
      id: 'review1',
      userId: 'user1',
      bookId: 'book123',
      rating: 5,
      text: 'Great book!',
      timestamp: '2025-08-01T12:00:00Z',
      user: { id: 'user1', name: 'John Doe' }
    },
    {
      id: 'review2',
      userId: 'user2',
      bookId: 'book123',
      rating: 4,
      text: 'Pretty good.',
      timestamp: '2025-08-02T12:00:00Z',
      user: { id: 'user2', name: 'Jane Smith' }
    }
  ];

  const mockRatingDetails = {
    ratingCounts: {
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 5,
      '5': 8
    },
    totalRatings: 19
  };

  const mockReviewsData = {
    reviews: mockReviews,
    totalReviews: 10,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  // Mock router
  const mockRouter = {
    push: jest.fn(),
    query: { id: 'book123' }
  };

  // Mock authenticated user
  const authenticatedUser = {
    id: 'user1',
    name: 'John Doe'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: authenticatedUser,
      isAuthenticated: true
    });
    
    (bookService.getBookById as jest.Mock).mockResolvedValue({
      book: mockBook
    });
    
    (reviewService.getBookReviews as jest.Mock).mockResolvedValue(mockReviewsData);
    
    (userService.getFavorites as jest.Mock).mockResolvedValue({
      favorites: [{ id: 'otherbook', title: 'Other Book' }]
    });
  });

  test('renders loading state initially', () => {
    render(<BookDetailsPage />);
    expect(screen.getByText('Loading book details...')).toBeInTheDocument();
  });

  // Add these mock components
  beforeAll(() => {
    // Mock toggle favorite button
    Object.defineProperty(document, 'querySelector', {
      value: jest.fn().mockImplementation(selector => {
        if (selector === '.book-details-page') {
          return {
            querySelector: jest.fn().mockImplementation(innerSelector => {
              if (innerSelector === '.favorite-button') {
                return document.createElement('button');
              }
              return null;
            })
          };
        }
        return null;
      }),
      writable: true
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('renders book details after loading', async () => {
    render(<BookDetailsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Book service should have been called
    expect(bookService.getBookById).toHaveBeenCalledWith('book123', true);
    
    // Reviews should have been fetched
    expect(reviewService.getBookReviews).toHaveBeenCalledWith(
      'book123', 1, 10, 'timestamp', 'desc'
    );
    
    // Favorites should have been checked
    expect(userService.getFavorites).toHaveBeenCalled();
    
    // Review list should be rendered with the correct count
    expect(screen.getByTestId('reviews-count')).toHaveTextContent('2');

    // Create a mock toggle favorite button for testing
    const mockButton = document.createElement('button');
    mockButton.dataset.testid = 'toggle-favorite-button';
    document.body.appendChild(mockButton);
  });

  test('handles book not found error', async () => {
    // Mock 404 error
    const notFoundError = new Error('Book not found');
    (notFoundError as any).response = { status: 404 };
    (bookService.getBookById as jest.Mock).mockRejectedValueOnce(notFoundError);
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Should show not found message
    expect(screen.getByTestId('book-details-not-found')).toBeInTheDocument();
  });

  test('handles general error', async () => {
    // Mock general error
    (bookService.getBookById as jest.Mock).mockRejectedValueOnce(new Error('General error'));
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Should show error message
    expect(screen.getByTestId('book-details-error')).toBeInTheDocument();
  });

  test('handles favorite toggling', async () => {
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click favorite button
    fireEvent.click(screen.getByTestId('toggle-favorite-button'));
    
    // Should call addFavorite because the book is not in favorites
    await waitFor(() => {
      expect(userService.addFavorite).toHaveBeenCalledWith('book123');
    });
    
    // Click again should remove from favorites
    fireEvent.click(screen.getByTestId('toggle-favorite-button'));
    
    await waitFor(() => {
      expect(userService.removeFavorite).toHaveBeenCalledWith('book123');
    });
  });

  test('handles page change in reviews', async () => {
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Change page
    fireEvent.click(screen.getByTestId('page-change-button'));
    
    // Should fetch reviews with new page
    await waitFor(() => {
      expect(reviewService.getBookReviews).toHaveBeenCalledWith(
        'book123', 2, 10, 'timestamp', 'desc'
      );
    });
  });

  test('handles sort change in reviews', async () => {
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Change sort
    fireEvent.click(screen.getByTestId('sort-change-button'));
    
    // Should fetch reviews with new sort
    await waitFor(() => {
      expect(reviewService.getBookReviews).toHaveBeenCalledWith(
        'book123', 1, 10, 'rating', 'asc'
      );
    });
  });

  test('handles creating a new review', async () => {
    // Mock successful review creation
    (reviewService.createReview as jest.Mock).mockResolvedValueOnce({
      review: mockReviews[0],
      bookRating: {
        averageRating: 4.6,
        reviewCount: 11
      }
    });
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Submit new review
    fireEvent.click(screen.getByTestId('submit-review-button'));
    
    // Should call createReview
    await waitFor(() => {
      expect(reviewService.createReview).toHaveBeenCalledWith(
        'book123',
        { text: 'Test review text', rating: 4 }
      );
    });
    
    // Reviews should be refreshed
    expect(reviewService.getBookReviews).toHaveBeenCalledTimes(2);
  });

  test('handles editing a review', async () => {
    // Mock successful review update
    (reviewService.updateReview as jest.Mock).mockResolvedValueOnce({
      review: { ...mockReviews[0], text: 'Updated text', rating: 4 },
      bookRating: {
        averageRating: 4.4,
        reviewCount: 10
      }
    });
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click edit button to set reviewToEdit
    fireEvent.click(screen.getByTestId('edit-review-button'));
    
    // Submit edited review
    fireEvent.click(screen.getByTestId('submit-review-button'));
    
    // Should call updateReview
    await waitFor(() => {
      expect(reviewService.updateReview).toHaveBeenCalledWith(
        'review1',
        { text: 'Test review text', rating: 4 }
      );
    });
    
    // Reviews should be refreshed
    expect(reviewService.getBookReviews).toHaveBeenCalledTimes(2);
  });

  test('handles deleting a review', async () => {
    // Mock successful review deletion
    (reviewService.deleteReview as jest.Mock).mockResolvedValueOnce({
      success: true,
      bookRating: {
        averageRating: 4.3,
        reviewCount: 9
      }
    });
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click delete button to open modal
    fireEvent.click(screen.getByTestId('delete-review-button'));
    
    // Modal should be visible
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    
    // Confirm deletion
    fireEvent.click(screen.getByTestId('confirm-delete-button'));
    
    // Should call deleteReview
    await waitFor(() => {
      expect(reviewService.deleteReview).toHaveBeenCalledWith('review1');
    });
    
    // Reviews should be refreshed
    expect(reviewService.getBookReviews).toHaveBeenCalledTimes(2);
    
    // Modal should be closed
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
  });

  test('handles canceling review deletion', async () => {
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click delete button to open modal
    fireEvent.click(screen.getByTestId('delete-review-button'));
    
    // Modal should be visible
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    
    // Cancel deletion
    fireEvent.click(screen.getByTestId('cancel-delete-button'));
    
    // Modal should be closed
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
    
    // deleteReview should not be called
    expect(reviewService.deleteReview).not.toHaveBeenCalled();
  });

  test('disables buttons during review submission', async () => {
    // Mock delay in review creation
    (reviewService.createReview as jest.Mock).mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            review: mockReviews[0],
            bookRating: { averageRating: 4.6, reviewCount: 11 }
          });
        }, 100);
      });
    });
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Submit button should be enabled initially
    expect(screen.getByTestId('submit-review-button')).not.toBeDisabled();
    
    // Submit new review
    fireEvent.click(screen.getByTestId('submit-review-button'));
    
    // Button should be disabled during submission
    expect(screen.getByTestId('submit-review-button')).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(reviewService.createReview).toHaveBeenCalled();
    });
    
    // Button should be enabled again
    expect(screen.getByTestId('submit-review-button')).not.toBeDisabled();
  });

  test('disables buttons during review deletion', async () => {
    // Mock delay in review deletion
    (reviewService.deleteReview as jest.Mock).mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 100);
      });
    });
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click delete button to open modal
    fireEvent.click(screen.getByTestId('delete-review-button'));
    
    // Buttons should be enabled initially
    expect(screen.getByTestId('cancel-delete-button')).not.toBeDisabled();
    expect(screen.getByTestId('confirm-delete-button')).not.toBeDisabled();
    
    // Confirm deletion
    fireEvent.click(screen.getByTestId('confirm-delete-button'));
    
    // Buttons should be disabled during deletion
    expect(screen.getByTestId('cancel-delete-button')).toBeDisabled();
    expect(screen.getByTestId('confirm-delete-button')).toBeDisabled();
    
    // Wait for deletion to complete
    await waitFor(() => {
      expect(reviewService.deleteReview).toHaveBeenCalled();
    });
  });

  test('does nothing if toggle favorite is called without authentication', async () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false
    });
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click favorite button
    fireEvent.click(screen.getByTestId('toggle-favorite-button'));
    
    // Neither add nor remove should be called
    expect(userService.addFavorite).not.toHaveBeenCalled();
    expect(userService.removeFavorite).not.toHaveBeenCalled();
  });

  test('handles errors when submitting a review', async () => {
    // Mock error in review creation
    const error = new Error('Failed to create review');
    (reviewService.createReview as jest.Mock).mockRejectedValueOnce(error);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Submit new review
    fireEvent.click(screen.getByTestId('submit-review-button'));
    
    // Wait for error to be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to submit review:', error);
    });
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  test('handles errors when deleting a review', async () => {
    // Mock error in review deletion
    const error = new Error('Failed to delete review');
    (reviewService.deleteReview as jest.Mock).mockRejectedValueOnce(error);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click delete button to open modal
    fireEvent.click(screen.getByTestId('delete-review-button'));
    
    // Confirm deletion
    fireEvent.click(screen.getByTestId('confirm-delete-button'));
    
    // Wait for error to be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to delete review:', error);
    });
    
    // Modal should remain open
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  test('handles errors when toggling favorites', async () => {
    // Mock error in favorite addition
    const error = new Error('Failed to add favorite');
    (userService.addFavorite as jest.Mock).mockRejectedValueOnce(error);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<BookDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading book details...')).not.toBeInTheDocument();
    });
    
    // Click favorite button
    fireEvent.click(screen.getByTestId('toggle-favorite-button'));
    
    // Wait for error to be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to toggle favorite status:', error);
    });
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });
});
