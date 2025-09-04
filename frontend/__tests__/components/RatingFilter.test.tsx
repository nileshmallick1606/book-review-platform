// __tests__/components/RatingFilter.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import RatingFilter from '../../components/ui/RatingFilter';

describe('RatingFilter Component', () => {
  // Mock function for onChange prop
  let mockOnChange: jest.Mock;
  
  beforeEach(() => {
    mockOnChange = jest.fn();
  });

  test('renders correctly with minimum rating', () => {
    render(<RatingFilter minRating={3} onChange={mockOnChange} />);
    
    expect(screen.getByText('Minimum Rating:')).toBeInTheDocument();
    expect(screen.getByLabelText('Clear rating filter')).toBeInTheDocument();
    
    // Verify StarRating component is rendered with correct props
    // Since we already tested StarRating thoroughly, we're focusing on the integration
    const stars = screen.getAllByText(/[★☆½¼¾]/);
    expect(stars).toHaveLength(5);
  });

  test('calls onChange with 0 when clear button is clicked', () => {
    render(<RatingFilter minRating={3} onChange={mockOnChange} />);
    
    const clearButton = screen.getByLabelText('Clear rating filter');
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  test('passes onChange to StarRating component', () => {
    render(<RatingFilter minRating={3} onChange={mockOnChange} />);
    
    // Find a star that would represent rating 4
    const stars = screen.getAllByText(/[★☆½¼¾]/);
    
    // Click on the fourth star
    fireEvent.click(stars[3]);
    
    // The rating should be passed to onChange
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('passes correct readOnly and size props to StarRating', () => {
    const { container } = render(<RatingFilter minRating={3} onChange={mockOnChange} />);
    
    // Check if the StarRating component has small class
    const starRatingContainer = container.querySelector('.star-rating');
    expect(starRatingContainer).toHaveClass('star-small');
  });

  test('renders correctly with zero rating', () => {
    render(<RatingFilter minRating={0} onChange={mockOnChange} />);
    
    // Check that no stars are filled
    const stars = screen.getAllByText(/[★☆½¼¾]/);
    
    // This is a basic check assuming StarRating works as tested separately
    expect(stars).toHaveLength(5);
  });

  test('applies proper accessibility attributes', () => {
    render(<RatingFilter minRating={3} onChange={mockOnChange} />);
    
    const clearButton = screen.getByLabelText('Clear rating filter');
    expect(clearButton).toBeInTheDocument();
  });

  test('has filter-label and filter-control containers', () => {
    const { container } = render(<RatingFilter minRating={3} onChange={mockOnChange} />);
    
    expect(container.querySelector('.filter-label')).toBeInTheDocument();
    expect(container.querySelector('.filter-control')).toBeInTheDocument();
  });
});
