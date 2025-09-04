// __tests__/components/ReviewForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ReviewForm from '../../components/review/ReviewForm';
import { Review } from '../../services/reviewService';

// Define the review submission function type to match ReviewFormProps
type ReviewSubmitFn = (data: { bookId: string; text: string; rating: number }) => Promise<void>;

// Mock StarRating component
jest.mock('../../components/ui/StarRating', () => {
  return function MockedStarRating({ rating, onChange }: { rating: number, onChange: (rating: number) => void }) {
    return (
      <div data-testid="star-rating">
        <span>Current rating: {rating}</span>
        <button type="button" onClick={() => onChange(1)}>Rate 1</button>
        <button type="button" onClick={() => onChange(3)}>Rate 3</button>
        <button type="button" onClick={() => onChange(5)}>Rate 5</button>
      </div>
    );
  };
});

describe('ReviewForm Component', () => {
  // Setup userEvent
  const user = userEvent.setup();
  
  // Common props for testing
  const mockSubmitFn = jest.fn<Promise<void>, [{ bookId: string; text: string; rating: number }]>()
    .mockResolvedValue(Promise.resolve());
  
  const defaultProps = {
    bookId: 'book123',
    onSubmit: mockSubmitFn,
    isSubmitting: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create review form correctly', () => {
    render(<ReviewForm {...defaultProps} />);
    
    // Check that form elements are rendered
    expect(screen.getByText('Write a Review')).toBeTruthy();
    expect(screen.getByLabelText('Rating:')).toBeTruthy();
    expect(screen.getByTestId('star-rating')).toBeTruthy();
    expect(screen.getByLabelText('Your Review:')).toBeTruthy();
    expect(screen.getByPlaceholderText('Share your thoughts about this book...')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeTruthy();
    
    // Cancel button should not be present without onCancel prop
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  test('renders edit review form correctly', () => {
    const existingReview: Review = {
      id: 'review123',
      bookId: 'book123',
      userId: 'user123',
      text: 'This is an existing review',
      rating: 4,
      timestamp: new Date().toISOString()
    };

    render(<ReviewForm {...defaultProps} review={existingReview} onCancel={() => {}} />);
    
    // Check that form is in edit mode with existing values
    expect(screen.getByText('Edit Your Review')).toBeTruthy();
    expect(screen.getByText(/Current rating: 4/)).toBeTruthy();
    expect(screen.getByDisplayValue('This is an existing review')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Update Review' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  test('shows validation errors when form is submitted without data', async () => {
    render(<ReviewForm {...defaultProps} />);
    
    // Submit the form without entering any data
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check error messages
    await waitFor(() => {
      expect(screen.getByText('Review text is required')).toBeTruthy();
      expect(screen.getByText('Please select a rating')).toBeTruthy();
    });
    
    // Make sure the onSubmit prop was not called
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  test('submits form when data is valid', async () => {
    render(<ReviewForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Your Review:'), {
      target: { value: 'This is my review' }
    });
    
    // Set rating using our mocked StarRating component
    fireEvent.click(screen.getByRole('button', { name: 'Rate 5' }));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        bookId: 'book123',
        text: 'This is my review',
        rating: 5
      });
    });
  });

  test('clears form after successful submission when creating new review', async () => {
    render(<ReviewForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Your Review:'), {
      target: { value: 'This is my review' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rate 3' }));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that form is reset after submission
    await waitFor(() => {
      const textInput = screen.getByLabelText('Your Review:') as HTMLTextAreaElement;
      expect(textInput.value).toBe('');
      expect(screen.getByText('Current rating: 0')).toBeTruthy();
    });
  });

  test('does not clear form after successful submission when editing', async () => {
    const existingReview: Review = {
      id: 'review123',
      bookId: 'book123',
      userId: 'user123',
      text: 'This is an existing review',
      rating: 4,
      timestamp: new Date().toISOString()
    };

    render(<ReviewForm {...defaultProps} review={existingReview} onCancel={() => {}} />);
    
    // Submit the form without changing anything
    fireEvent.click(screen.getByRole('button', { name: 'Update Review' }));
    
    // Check that form still has the values
    await waitFor(() => {
      expect(screen.getByDisplayValue('This is an existing review')).toBeTruthy();
    });
  });

  test('shows submitting state', () => {
    render(<ReviewForm {...defaultProps} isSubmitting={true} />);
    
    // Check that the submit button shows the loading state
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeTruthy();
    const submitButton = screen.getByRole('button', { name: 'Submitting...' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  test('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ReviewForm {...defaultProps} onCancel={onCancel} />);
    
    // Click the cancel button
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Check that onCancel was called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
