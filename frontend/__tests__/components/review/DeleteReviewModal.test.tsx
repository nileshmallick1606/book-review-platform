import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteReviewModal from '../../../components/review/DeleteReviewModal';

describe('DeleteReviewModal Component', () => {
  // Mock functions
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DeleteReviewModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
        isDeleting={false} 
      />
    );
    
    expect(container).toBeEmptyDOMElement();
  });
  
  test('renders modal content when isOpen is true', () => {
    render(
      <DeleteReviewModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
        isDeleting={false} 
      />
    );
    
    // Check modal title is displayed
    expect(screen.getByText('Delete Review')).toBeInTheDocument();
    
    // Check confirmation message is displayed
    expect(screen.getByText('Are you sure you want to delete this review? This action cannot be undone.')).toBeInTheDocument();
    
    // Check buttons are displayed
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  test('calls onClose when Cancel button is clicked', () => {
    render(
      <DeleteReviewModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
        isDeleting={false} 
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('calls onConfirm when Delete button is clicked', () => {
    render(
      <DeleteReviewModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
        isDeleting={false} 
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
  
  test('displays loading state when isDeleting is true', () => {
    render(
      <DeleteReviewModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
        isDeleting={true} 
      />
    );
    
    // Check button text changes
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    
    // Check buttons are disabled
    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByText('Deleting...');
    
    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });
  
  test('buttons remain enabled when isDeleting is false', () => {
    render(
      <DeleteReviewModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
        isDeleting={false} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByText('Delete');
    
    expect(cancelButton).not.toBeDisabled();
    expect(deleteButton).not.toBeDisabled();
  });
});
