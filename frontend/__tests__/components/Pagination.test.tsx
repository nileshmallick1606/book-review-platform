// __tests__/components/Pagination.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import Pagination from '../../components/ui/Pagination';

describe('Pagination Component', () => {
  // Mock function for onPageChange prop
  let mockOnPageChange: jest.Mock;
  
  beforeEach(() => {
    mockOnPageChange = jest.fn();
  });

  test('does not render when there is only one page', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders with correct number of page buttons for small page count', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    // Check if all page numbers are rendered
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // No ellipsis should be rendered for small page count
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  test('renders with ellipsis for large page count', () => {
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
    );

    // Check for ellipsis
    const ellipsis = screen.getAllByText('…');
    expect(ellipsis.length).toBe(2);

    // Check for first and last page
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Check for pages around current page
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('highlights current page', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('active');

    // Other page buttons should not have active class
    const otherPageButton = screen.getByText('1');
    expect(otherPageButton).not.toHaveClass('active');
  });

  test('calls onPageChange with correct page number when page button is clicked', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const pageButton = screen.getByText('4');
    fireEvent.click(pageButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  test('disables previous button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const prevButton = screen.getByLabelText('Go to previous page');
    expect(prevButton).toBeDisabled();
  });

  test('disables next button on last page', () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeDisabled();
  });

  test('enables previous and next buttons on middle pages', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const prevButton = screen.getByLabelText('Go to previous page');
    const nextButton = screen.getByLabelText('Go to next page');

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  test('calls onPageChange with previous page when previous button is clicked', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const prevButton = screen.getByLabelText('Go to previous page');
    fireEvent.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  test('calls onPageChange with next page when next button is clicked', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    const nextButton = screen.getByLabelText('Go to next page');
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  test('applies correct ARIA attributes for accessibility', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
    );

    // Current page should have aria-current="page"
    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');

    // Other pages should not have aria-current attribute
    const otherPageButton = screen.getByText('2');
    expect(otherPageButton).not.toHaveAttribute('aria-current');

    // Check navigation button labels
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
  });

  test('renders correctly when current page is near start (edge case)', () => {
    render(
      <Pagination currentPage={2} totalPages={10} onPageChange={mockOnPageChange} />
    );

    // No start ellipsis when current page is near start
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Only end ellipsis should be visible
    const ellipsis = screen.getAllByText('…');
    expect(ellipsis.length).toBe(1);
    
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('renders correctly when current page is near end (edge case)', () => {
    render(
      <Pagination currentPage={9} totalPages={10} onPageChange={mockOnPageChange} />
    );

    // Only start ellipsis should be visible
    expect(screen.getByText('1')).toBeInTheDocument();
    const ellipsis = screen.getAllByText('…');
    expect(ellipsis.length).toBe(1);
    
    // No end ellipsis when current page is near end
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
