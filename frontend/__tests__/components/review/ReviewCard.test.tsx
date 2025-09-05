import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewCard from '../../../components/review/ReviewCard';
import { Review } from '../../../services/reviewService';

describe('ReviewCard Component', () => {
  // Mock review data
  const mockReview: Review = {
    id: '123',
    userId: '456',
    bookId: '789',
    rating: 4,
    text: 'This is a test review.',
    timestamp: '2025-08-01T12:00:00Z',
    user: {
      id: '456',
      name: 'John Doe'
    }
  };
  
  // Mock functions
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders review content correctly', () => {
    render(<ReviewCard review={mockReview} isOwner={false} />);
    
    // Check user name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check review text is displayed
    expect(screen.getByText('This is a test review.')).toBeInTheDocument();
    
    // Check date formatting
    expect(screen.getByText('August 1, 2025')).toBeInTheDocument();
    
    // Star rating should be displayed
    expect(document.querySelector('.star-rating')).toBeInTheDocument();
  });
  
  test('shows edit and delete buttons for review owner', () => {
    render(
      <ReviewCard 
        review={mockReview} 
        isOwner={true} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check buttons are rendered
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  test('hides edit and delete buttons for non-owner', () => {
    render(
      <ReviewCard 
        review={mockReview} 
        isOwner={false} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check buttons are not rendered
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
  
  test('calls onEdit when edit button is clicked', () => {
    render(
      <ReviewCard 
        review={mockReview} 
        isOwner={true} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockReview);
  });
  
  test('calls onDelete when delete button is clicked', () => {
    render(
      <ReviewCard 
        review={mockReview} 
        isOwner={true} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });
  
  test('handles undefined onEdit and onDelete props', () => {
    render(<ReviewCard review={mockReview} isOwner={true} />);
    
    // Should not throw errors when clicking buttons without handlers
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Delete'));
    
    // Test passes if no exception is thrown
  });
  
  test('displays Anonymous User when user name is not provided', () => {
    const reviewWithoutUser = {
      ...mockReview,
      user: undefined
    };
    
    render(<ReviewCard review={reviewWithoutUser} isOwner={false} />);
    expect(screen.getByText('Anonymous User')).toBeInTheDocument();
  });
});
