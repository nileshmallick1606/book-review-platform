// __tests__/components/RatingSummary.test.tsx
import React from 'react';
import { render, screen } from '../utils/test-utils';
import { describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import RatingSummary from '../../components/ui/RatingSummary';

describe('RatingSummary Component', () => {
  const mockDistribution = {
    '1': 5,
    '2': 10,
    '3': 20,
    '4': 30,
    '5': 15
  };

  test('renders with average rating and review count', () => {
    render(
      <RatingSummary
        averageRating={4.2}
        reviewCount={80}
      />
    );

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('80 reviews')).toBeInTheDocument();
  });

  test('displays singular "review" text when only one review', () => {
    render(
      <RatingSummary
        averageRating={4.0}
        reviewCount={1}
      />
    );

    expect(screen.getByText('1 review')).toBeInTheDocument();
  });

  test('applies correct size class to StarRating component', () => {
    const { container } = render(
      <RatingSummary
        averageRating={3.5}
        reviewCount={42}
        size="small"
      />
    );

    const starRatingContainer = container.querySelector('.star-rating');
    expect(starRatingContainer).toHaveClass('star-small');
  });

  test('hides average rating when showAverage is false', () => {
    render(
      <RatingSummary
        averageRating={4.2}
        reviewCount={80}
        showAverage={false}
      />
    );

    expect(screen.queryByText('4.2')).not.toBeInTheDocument();
  });

  test('hides review count when showCount is false', () => {
    render(
      <RatingSummary
        averageRating={4.2}
        reviewCount={80}
        showCount={false}
      />
    );

    expect(screen.queryByText('80 reviews')).not.toBeInTheDocument();
  });

  test('renders rating distribution when provided', () => {
    const { container } = render(
      <RatingSummary
        averageRating={3.5}
        reviewCount={80}
        distribution={mockDistribution}
      />
    );

    // Check if distribution rows are displayed
    const distributionRows = container.querySelectorAll('.distribution-row');
    expect(distributionRows.length).toBe(5);
    
    // Check labels
    const starLabels = container.querySelectorAll('.star-label');
    expect(starLabels[0].textContent).toBe('5');
    expect(starLabels[1].textContent).toBe('4');
    expect(starLabels[2].textContent).toBe('3');
    expect(starLabels[3].textContent).toBe('2');
    expect(starLabels[4].textContent).toBe('1');

    // Check count values are displayed
    const countElements = container.querySelectorAll('.count');
    expect(countElements[0].textContent).toBe('15');
    expect(countElements[1].textContent).toBe('30');
    expect(countElements[2].textContent).toBe('20');
    expect(countElements[3].textContent).toBe('10');
    expect(countElements[4].textContent).toBe('5');
  });

  test('does not render distribution when not provided', () => {
    const { container } = render(
      <RatingSummary
        averageRating={3.5}
        reviewCount={80}
      />
    );

    const distributionElement = container.querySelector('.rating-distribution');
    expect(distributionElement).not.toBeInTheDocument();
  });

  test('does not render distribution when maxCount is 0', () => {
    const emptyDistribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };

    const { container } = render(
      <RatingSummary
        averageRating={0}
        reviewCount={0}
        distribution={emptyDistribution}
      />
    );

    const distributionElement = container.querySelector('.rating-distribution');
    expect(distributionElement).not.toBeInTheDocument();
  });

  test('has correct accessibility attributes', () => {
    render(
      <RatingSummary
        averageRating={4.2}
        reviewCount={80}
        distribution={mockDistribution}
      />
    );

    expect(screen.getByLabelText('Average rating: 4.2 out of 5 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rating distribution')).toBeInTheDocument();
    expect(screen.getByLabelText('5 stars: 15 reviews')).toBeInTheDocument();
    expect(screen.getByLabelText('1 stars: 5 reviews')).toBeInTheDocument();
  });

  test('calculates bar widths correctly based on distribution', () => {
    const { container } = render(
      <RatingSummary
        averageRating={3.5}
        reviewCount={80}
        distribution={mockDistribution}
      />
    );

    const bars = container.querySelectorAll('.bar');
    
    // The max count is 30, so a count of 15 should be 50% width
    const fiveStarBar = bars[0]; // First bar is for 5 stars
    expect(fiveStarBar).toHaveStyle('width: 50%');

    // A count of 30 should be 100% width
    const fourStarBar = bars[1]; // Second bar is for 4 stars
    expect(fourStarBar).toHaveStyle('width: 100%');
  });
});
