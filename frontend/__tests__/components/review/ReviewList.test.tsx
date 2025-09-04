// __tests__/components/review/ReviewList.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ReviewList from '../../../components/review/ReviewList';
import { Review } from '../../../services/reviewService';

// Mock the ReviewCard component
jest.mock('../../../components/review/ReviewCard', () => {
  return function MockReviewCard({ review, isOwner, onEdit, onDelete }: { 
    review: Review; 
    isOwner: boolean; 
    onEdit: (review: Review) => void; 
    onDelete: (reviewId: string) => void;
  }) {
    return (
      <div data-testid={`review-card-${review.id}`} className="review-card">
        <div>{review.text}</div>
        <div>Rating: {review.rating}</div>
        {isOwner && (
          <div>
            <button onClick={() => onEdit(review)}>Edit</button>
            <button onClick={() => onDelete(review.id)}>Delete</button>
          </div>
        )}
      </div>
    );
  };
});

// Test data
const mockReviews: Review[] = [
  {
    id: '1',
    bookId: 'book1',
    userId: 'user1',
    text: 'Excellent book',
    rating: 5,
    timestamp: '2023-01-01T12:00:00Z',
    user: {
      id: 'user1',
      name: 'User One'
    }
  },
  {
    id: '2',
    bookId: 'book1',
    userId: 'user2',
    text: 'Average book',
    rating: 3,
    timestamp: '2023-01-02T12:00:00Z',
    user: {
      id: 'user2',
      name: 'User Two'
    }
  },
  {
    id: '3',
    bookId: 'book1',
    userId: 'user1',
    text: 'Good book',
    rating: 4,
    timestamp: '2023-01-03T12:00:00Z',
    user: {
      id: 'user1',
      name: 'User One'
    }
  }
];

describe('ReviewList Component', () => {
  const onPageChangeMock = jest.fn();
  const onSortChangeMock = jest.fn();
  const onEditReviewMock = jest.fn();
  const onDeleteReviewMock = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state correctly', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={[]}
        totalReviews={0}
        currentPage={1}
        totalPages={0}
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={true}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('renders empty state when no reviews are available', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={[]}
        totalReviews={0}
        currentPage={1}
        totalPages={0}
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    expect(screen.getByText('No reviews yet. Be the first to review!')).toBeInTheDocument();
  });
  
  test('renders reviews correctly', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={mockReviews.length}
        currentPage={1}
        totalPages={1}
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    expect(screen.getByText(`Reviews (${mockReviews.length})`)).toBeInTheDocument();
    expect(screen.getByTestId('review-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('review-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('review-card-3')).toBeInTheDocument();
    expect(screen.getByText('Excellent book')).toBeInTheDocument();
    expect(screen.getByText('Average book')).toBeInTheDocument();
    expect(screen.getByText('Good book')).toBeInTheDocument();
  });
  
  test('handles sort change correctly', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={mockReviews.length}
        currentPage={1}
        totalPages={1}
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    const sortSelect = screen.getByLabelText('Sort by:');
    
    // Test oldest first sorting
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });
    expect(onSortChangeMock).toHaveBeenCalledWith('timestamp', 'asc');
    
    // Test highest rating sorting
    fireEvent.change(sortSelect, { target: { value: 'highest' } });
    expect(onSortChangeMock).toHaveBeenCalledWith('rating', 'desc');
    
    // Test lowest rating sorting
    fireEvent.change(sortSelect, { target: { value: 'lowest' } });
    expect(onSortChangeMock).toHaveBeenCalledWith('rating', 'asc');
    
    // Test newest first sorting (default)
    fireEvent.change(sortSelect, { target: { value: 'newest' } });
    expect(onSortChangeMock).toHaveBeenCalledWith('timestamp', 'desc');
  });
  
  test('renders pagination correctly and handles page changes', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={10}
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    // Check if pagination buttons are rendered
    const prevButton = screen.getByText('Previous');
    const nextButton = screen.getByText('Next');
    const page1Button = screen.getByText('1');
    const page2Button = screen.getByText('2');
    const page3Button = screen.getByText('3');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(page1Button).toBeInTheDocument();
    expect(page2Button).toBeInTheDocument();
    expect(page3Button).toBeInTheDocument();
    
    // Current page should have 'active' class
    expect(page2Button.className).toContain('active');
    
    // Test page change clicks
    fireEvent.click(page1Button);
    expect(onPageChangeMock).toHaveBeenCalledWith(1);
    
    fireEvent.click(page3Button);
    expect(onPageChangeMock).toHaveBeenCalledWith(3);
    
    fireEvent.click(prevButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(1);
    
    fireEvent.click(nextButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(3);
  });
  
  test('does not render pagination when only one page exists', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={3}
        currentPage={1}
        totalPages={1}
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    const paginationElement = screen.queryByText('Previous');
    expect(paginationElement).not.toBeInTheDocument();
  });
  
  test('handles edit review button click', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={mockReviews.length}
        currentPage={1}
        totalPages={1}
        userId="user1" // Match the userId of reviews 1 and 3
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    // Find and click the edit button for review 1
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(onEditReviewMock).toHaveBeenCalledWith(mockReviews[0]);
  });
  
  test('handles delete review button click', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={mockReviews.length}
        currentPage={1}
        totalPages={1}
        userId="user1" // Match the userId of reviews 1 and 3
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    // Find and click the delete button for review 1
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(onDeleteReviewMock).toHaveBeenCalledWith(mockReviews[0].id);
  });
  
  test('only shows edit/delete buttons for reviews owned by the current user', () => {
    render(
      <ReviewList
        bookId="book1"
        reviews={mockReviews}
        totalReviews={mockReviews.length}
        currentPage={1}
        totalPages={1}
        userId="user1" // Match the userId of reviews 1 and 3
        onPageChange={onPageChangeMock}
        onSortChange={onSortChangeMock}
        onEditReview={onEditReviewMock}
        onDeleteReview={onDeleteReviewMock}
        loading={false}
      />
    );
    
    // User1 owns reviews 1 and 3, so we should see 2 edit buttons and 2 delete buttons
    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');
    
    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);
  });
});
