// __tests__/components/review/UserReviews.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import UserReviews from '../../../components/review/UserReviews';
import userService from '../../../services/userService';
import reviewService from '../../../services/reviewService';
import { Review } from '../../../types';

// Mock dependencies
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../../services/userService', () => ({
  getUserReviews: jest.fn()
}));

jest.mock('../../../services/reviewService', () => ({
  deleteReview: jest.fn()
}));

// Mock window.confirm
const originalConfirm = window.confirm;
beforeEach(() => {
  window.confirm = jest.fn();
});

afterEach(() => {
  window.confirm = originalConfirm;
});

// Mock review data
const mockReviews = [
  {
    id: '1',
    bookId: 'book1',
    userId: 'user1',
    text: 'Great book!',
    rating: 5,
    timestamp: '2023-01-01T12:00:00Z',
    book: {
      id: 'book1',
      title: 'Test Book 1',
      author: 'Author 1',
      coverImage: 'cover1.jpg'
    }
  },
  {
    id: '2',
    bookId: 'book2',
    userId: 'user1',
    text: 'Average book',
    rating: 3,
    timestamp: '2023-01-02T12:00:00Z',
    book: {
      id: 'book2',
      title: 'Test Book 2',
      author: 'Author 2',
      coverImage: 'cover2.jpg'
    }
  }
];

describe('UserReviews Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state correctly', () => {
    (userService.getUserReviews as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<UserReviews userId="user1" />);
    
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
  });

  test('renders error state correctly', async () => {
    const errorMessage = 'Failed to fetch reviews';
    (userService.getUserReviews as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('renders empty state when no reviews exist', async () => {
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: [],
      totalPages: 0
    });

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText("You haven't written any reviews yet.")).toBeInTheDocument();
    });
  });

  test('renders reviews correctly', async () => {
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: mockReviews,
      totalPages: 1
    });

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('My Reviews')).toBeInTheDocument();
      expect(screen.getByText('Great book!')).toBeInTheDocument();
      expect(screen.getByText('Average book')).toBeInTheDocument();
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2')).toBeInTheDocument();
      expect(screen.getByText('Author 1')).toBeInTheDocument();
      expect(screen.getByText('Author 2')).toBeInTheDocument();
      
      // Check for rating stars
      const ratings = screen.getAllByText('★★★★★');
      expect(ratings).toHaveLength(1);
      
      const partialRatings = screen.getAllByText('★★★☆☆');
      expect(partialRatings).toHaveLength(1);
      
      // Check for edit and delete buttons
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(2);
      
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  test('handles pagination correctly', async () => {
    // First page
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: mockReviews,
      totalPages: 3,
      page: 1
    });

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeDisabled();
      expect(screen.getByText('Next')).not.toBeDisabled();
    });

    // Mock second page data
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: [
        {
          id: '3',
          bookId: 'book3',
          userId: 'user1',
          text: 'Excellent read',
          rating: 4,
          timestamp: '2023-01-03T12:00:00Z',
          book: {
            id: 'book3',
            title: 'Test Book 3',
            author: 'Author 3',
            coverImage: 'cover3.jpg'
          }
        }
      ],
      totalPages: 3,
      page: 2
    });

    // Click next
    fireEvent.click(screen.getByText('Next'));
    
    // Should fetch page 2
    await waitFor(() => {
      expect(userService.getUserReviews).toHaveBeenCalledWith('user1', { page: 2 });
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
      expect(screen.getByText('Previous')).not.toBeDisabled();
      expect(screen.getByText('Next')).not.toBeDisabled();
    });

    // Click previous
    fireEvent.click(screen.getByText('Previous'));
    
    // Should fetch page 1 again
    await waitFor(() => {
      expect(userService.getUserReviews).toHaveBeenCalledWith('user1', { page: 1 });
    });
  });

  test('handles deleting a review with confirmation', async () => {
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: mockReviews,
      totalPages: 1
    });
    (window.confirm as jest.Mock).mockReturnValue(true);
    (reviewService.deleteReview as jest.Mock).mockResolvedValue({ success: true });

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(2);
    });
    
    // Click delete on the first review
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Should show confirmation
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this review?');
    
    // Should delete the review
    expect(reviewService.deleteReview).toHaveBeenCalledWith('1');
    
    // Should refetch reviews
    await waitFor(() => {
      expect(userService.getUserReviews).toHaveBeenCalledTimes(2);
    });
  });

  test('handles deleting a review with cancellation', async () => {
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: mockReviews,
      totalPages: 1
    });
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(2);
    });
    
    // Click delete on the first review
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Should show confirmation
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this review?');
    
    // Should not delete the review
    expect(reviewService.deleteReview).not.toHaveBeenCalled();
    
    // Should not refetch reviews
    expect(userService.getUserReviews).toHaveBeenCalledTimes(1);
  });

  test('handles error when deleting a review', async () => {
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: mockReviews,
      totalPages: 1
    });
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    const errorMessage = 'Failed to delete review';
    (reviewService.deleteReview as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(2);
    });
    
    // Click delete on the first review
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('refetches reviews when userId changes', async () => {
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: mockReviews,
      totalPages: 1
    });

    const { rerender } = render(<UserReviews userId="user1" />);
    
    await waitFor(() => {
      expect(userService.getUserReviews).toHaveBeenCalledWith('user1', { page: 1 });
      expect(screen.getByText('Great book!')).toBeInTheDocument();
    });
    
    // Reset mock and rerender with new userId
    jest.clearAllMocks();
    (userService.getUserReviews as jest.Mock).mockResolvedValue({ 
      reviews: [mockReviews[1]],
      totalPages: 1
    });
    
    rerender(<UserReviews userId="user2" />);
    
    await waitFor(() => {
      expect(userService.getUserReviews).toHaveBeenCalledWith('user2', { page: 1 });
    });
  });
});
