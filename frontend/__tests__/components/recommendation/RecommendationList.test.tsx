// __tests__/components/recommendation/RecommendationList.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import RecommendationList from '../../../components/recommendation/RecommendationList';

// Mock dependencies
jest.mock('../../../components/recommendation/RecommendationCard', () => {
  return function MockRecommendationCard({ recommendation }) {
    return (
      <div 
        data-testid="recommendation-card" 
        data-recommendation-id={recommendation.id}
      >
        {recommendation.title}
      </div>
    );
  };
});

describe('RecommendationList Component', () => {
  // Mock recommendations data
  const mockRecommendations = [
    {
      id: 'rec1',
      title: 'Book 1',
      author: 'Author 1',
      reason: 'Reason 1',
      genres: ['Fiction', 'Fantasy']
    },
    {
      id: 'rec2',
      title: 'Book 2',
      author: 'Author 2',
      reason: 'Reason 2',
      genres: ['Fiction', 'Mystery']
    },
    {
      id: 'rec3',
      title: 'Book 3',
      author: 'Author 3',
      reason: 'Reason 3',
      genres: ['Non-Fiction', 'History']
    }
  ];

  test('renders loading state correctly', () => {
    render(
      <RecommendationList 
        recommendations={[]}
        isLoading={true}
        error={null}
      />
    );
    
    expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
    expect(screen.getByText(/Loading recommendations/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    const onRefresh = jest.fn();
    
    render(
      <RecommendationList 
        recommendations={[]}
        isLoading={false}
        error="Failed to load recommendations"
        onRefresh={onRefresh}
      />
    );
    
    expect(screen.getByText(/Failed to load recommendations/i)).toBeInTheDocument();
    
    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeInTheDocument();
    
    fireEvent.click(tryAgainButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('renders empty state correctly', () => {
    const onRefresh = jest.fn();
    
    render(
      <RecommendationList 
        recommendations={[]}
        isLoading={false}
        error={null}
        onRefresh={onRefresh}
      />
    );
    
    expect(screen.getByText('No recommendations available.')).toBeInTheDocument();
    
    const getRecommendationsButton = screen.getByText('Get Recommendations');
    expect(getRecommendationsButton).toBeInTheDocument();
    
    fireEvent.click(getRecommendationsButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('renders recommendations list correctly', () => {
    render(
      <RecommendationList 
        recommendations={mockRecommendations}
        isLoading={false}
        error={null}
      />
    );
    
    const recommendationCards = screen.getAllByTestId('recommendation-card');
    expect(recommendationCards).toHaveLength(3);
    expect(screen.getByText('Book 1')).toBeInTheDocument();
    expect(screen.getByText('Book 2')).toBeInTheDocument();
    expect(screen.getByText('Book 3')).toBeInTheDocument();
  });

  test('filters recommendations by genre', () => {
    render(
      <RecommendationList 
        recommendations={mockRecommendations}
        isLoading={false}
        error={null}
        showFilters={true}
      />
    );
    
    // Should show all 3 recommendations initially
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(3);
    
    // Select Fantasy genre
    const genreFilter = screen.getByLabelText('Filter by genre:');
    fireEvent.change(genreFilter, { target: { value: 'Fantasy' } });
    
    // Should now show only 1 recommendation
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(1);
    expect(screen.getByText('Book 1')).toBeInTheDocument();
    expect(screen.queryByText('Book 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Book 3')).not.toBeInTheDocument();
    
    // Verify filter info text
    expect(screen.getByText('Showing recommendations for "Fantasy" genre')).toBeInTheDocument();
  });

  test('clears filter when reset button is clicked', () => {
    render(
      <RecommendationList 
        recommendations={mockRecommendations}
        isLoading={false}
        error={null}
        showFilters={true}
      />
    );
    
    // Select Mystery genre
    const genreFilter = screen.getByLabelText('Filter by genre:');
    fireEvent.change(genreFilter, { target: { value: 'Mystery' } });
    
    // Should show only 1 recommendation
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(1);
    
    // Click clear filter button
    const clearButton = screen.getByText('Clear Filter');
    fireEvent.click(clearButton);
    
    // Should now show all 3 recommendations again
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(3);
  });

  test('shows refresh button when onRefresh is provided', () => {
    const onRefresh = jest.fn();
    
    render(
      <RecommendationList 
        recommendations={mockRecommendations}
        isLoading={false}
        error={null}
        onRefresh={onRefresh}
        showFilters={true}
      />
    );
    
    const refreshButton = screen.getByText('Refresh Recommendations');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('filters recommendations by genre', () => {
    render(
      <RecommendationList 
        recommendations={mockRecommendations}
        isLoading={false}
        error={null}
        showFilters={true}
      />
    );
    
    // Should show all 3 recommendations initially
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(3);
    
    // Select Fiction genre - should now show 2 recommendations
    const genreFilter = screen.getByLabelText('Filter by genre:');
    fireEvent.change(genreFilter, { target: { value: 'Fiction' } });
    
    // Should show 2 Fiction books
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(2);
    
    // Select Non-Fiction genre - should now show 1 recommendation
    fireEvent.change(genreFilter, { target: { value: 'Non-Fiction' } });
    
    // Should show 1 Non-Fiction book
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(1);
  });
  
  test('clears filter when reset button is clicked', () => {
    render(
      <RecommendationList 
        recommendations={mockRecommendations}
        isLoading={false}
        error={null}
        showFilters={true}
      />
    );
    
    // Should show all 3 recommendations initially
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(3);
    
    // Select Non-Fiction genre - should now show 1 recommendation
    const genreFilter = screen.getByLabelText('Filter by genre:');
    fireEvent.change(genreFilter, { target: { value: 'Non-Fiction' } });
    
    // Should show 1 Non-Fiction book
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(1);
    
    // Click clear filter button
    const clearButton = screen.getByText('Clear Filter');
    fireEvent.click(clearButton);
    
    // Should now show all 3 recommendations again
    expect(screen.getAllByTestId('recommendation-card')).toHaveLength(3);
  });
});
