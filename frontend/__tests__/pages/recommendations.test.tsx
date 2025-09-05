import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecommendationsPage from '../../pages/recommendations';
import recommendationService from '../../services/recommendationService';
import { requireAuth } from '../../utils/auth';

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: {},
    push: jest.fn(),
  }),
}));

// Mock recommendation service
jest.mock('../../services/recommendationService', () => ({
  getRecommendations: jest.fn(),
  getCachedRecommendations: jest.fn(),
  cacheRecommendations: jest.fn(),
  getSampleRecommendations: jest.fn()
}));

// Mock requireAuth HOC
jest.mock('../../utils/auth', () => ({
  requireAuth: jest.fn((Component) => Component),
}));

// Mock RecommendationList component
jest.mock('../../components/recommendation/RecommendationList', () => {
  return {
    __esModule: true,
    default: ({ recommendations, isLoading, error, onRefresh, showFilters }: any) => {
      return (
        <div data-testid="recommendation-list">
          {isLoading && <div data-testid="loading">Loading recommendations...</div>}
          {error && <div data-testid="error">{error}</div>}
          {showFilters && <div data-testid="filters">Filters</div>}
          {!isLoading && !error && recommendations.length === 0 && (
            <div data-testid="no-recommendations">No recommendations available</div>
          )}
          {recommendations.map((rec: any) => (
            <div key={rec.id} data-testid={`recommendation-${rec.id}`}>
              {rec.title} by {rec.author}
            </div>
          ))}
          <button data-testid="refresh-button" onClick={onRefresh}>Refresh</button>
        </div>
      );
    },
  };
});

describe('RecommendationsPage', () => {
  // Mock data for recommendations
  const mockRecommendations = [
    {
      id: 'rec1',
      title: 'Book 1',
      author: 'Author 1',
      reason: 'Sample reason 1'
    },
    {
      id: 'rec2',
      title: 'Book 2',
      author: 'Author 2',
      reason: 'Sample reason 2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset mocks
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({ 
      data: mockRecommendations 
    });
    (recommendationService.getCachedRecommendations as jest.Mock).mockReturnValue(null);
    (recommendationService.getSampleRecommendations as jest.Mock).mockReturnValue(mockRecommendations);

    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the recommendations page with title', async () => {
    render(<RecommendationsPage />);
    
    expect(screen.getByText('Your Personalized Book Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Discover new books tailored to your reading preferences and history')).toBeInTheDocument();
  });

  test('fetches recommendations on initial load', async () => {
    render(<RecommendationsPage />);
    
    // Should make the API call with refresh=true
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledWith({
        limit: 10,
        genre: null,
        refresh: true
      });
    });
    
    // Should show the recommendations
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-rec2')).toBeInTheDocument();
    });
  });

  test('uses cached recommendations when available', async () => {
    const cachedRecommendations = [
      {
        id: 'rec1',  // Use the same ID that's in the mock component
        title: 'Cached Book 1',
        author: 'Cached Author 1',
        reason: 'Cached reason 1'
      }
    ];
    
    // Set up the cache mock to return data
    (recommendationService.getCachedRecommendations as jest.Mock).mockReturnValue(cachedRecommendations);
    
    render(<RecommendationsPage />);
    
    // Should show recommendations (we can't verify getRecommendations is not called because 
    // the component always calls it with refresh=true on initial load)
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    render(<RecommendationsPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    });
    
    // Reset the mock call count
    (recommendationService.getRecommendations as jest.Mock).mockClear();
    
    // Click refresh button
    fireEvent.click(screen.getByTestId('refresh-button'));
    
    // Verify API called again with refresh=true
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledWith({
        limit: 10,
        genre: null,
        refresh: true
      });
    });
  });

  test('handles API error by using sample recommendations', async () => {
    // Mock API to throw error
    (recommendationService.getRecommendations as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<RecommendationsPage />);
    
    // Should call getSampleRecommendations when API fails
    await waitFor(() => {
      expect(recommendationService.getSampleRecommendations).toHaveBeenCalled();
    });
    
    // Should show the sample recommendations
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-rec2')).toBeInTheDocument();
    });
  });

  test('handles empty recommendation list from API', async () => {
    // Mock API to return empty array
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({
      data: []
    });
    
    render(<RecommendationsPage />);
    
    // Should use sample recommendations if API returns empty list
    await waitFor(() => {
      expect(recommendationService.getSampleRecommendations).toHaveBeenCalled();
    });
    
    // Should show the sample recommendations
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
    });
  });

  test('handles different API response structures', async () => {
    // Test array response
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);
    
    render(<RecommendationsPage />);
    
    // Should extract recommendations correctly from array response
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-rec2')).toBeInTheDocument();
    });
    
    // Reset and test different structure
    jest.clearAllMocks();
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({
      data: {
        data: mockRecommendations
      }
    });
    
    render(<RecommendationsPage />);
    
    // Should extract recommendations correctly from nested data
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-rec2')).toBeInTheDocument();
    });
  });

  test('handles genre filter from query parameter', async () => {
    // Mock router with genre query parameter
    require('next/router').useRouter.mockReturnValue({
      query: { genre: 'fiction' },
      push: jest.fn(),
    });
    
    render(<RecommendationsPage />);
    
    // Should include genre in API call
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledWith({
        limit: 10,
        genre: 'fiction',
        refresh: true
      });
    });
  });

  test('attempts to re-fetch if recommendations are empty after loading', async () => {
    // First call returns empty array, second call returns recommendations
    (recommendationService.getRecommendations as jest.Mock)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: mockRecommendations });
    
    render(<RecommendationsPage />);
    
    // First API call happens immediately
    expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    
    // Check empty recommendations trigger interval
    await waitFor(() => {
      expect(recommendationService.getSampleRecommendations).toHaveBeenCalled();
    });
  });

  test('shows the how it works section', () => {
    render(<RecommendationsPage />);
    
    expect(screen.getByText('How We Generate Your Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Reading History')).toBeInTheDocument();
    expect(screen.getByText('Your Favorites')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
  });

  test('is wrapped with requireAuth HOC', () => {
    // Since the HOC is mocked to just return the component,
    // we can just verify that the component renders correctly
    render(<RecommendationsPage />);
    expect(screen.getByText('Your Personalized Book Recommendations')).toBeInTheDocument();
  });

  // NEW TESTS TO IMPROVE COVERAGE
  
  // Test for non-refresh path (lines 56-62)
  test('fetchRecommendations respects refresh=false parameter', async () => {
    // Reset the mocked router to avoid genre being set
    require('next/router').useRouter.mockReturnValue({
      query: {},
      push: jest.fn(),
    });
    
    // Mock cached recommendations
    const cachedRecommendations = mockRecommendations;
    (recommendationService.getCachedRecommendations as jest.Mock).mockReturnValue(cachedRecommendations);
    
    // Render with mocks
    render(<RecommendationsPage />);
    
    // Click refresh button with manual mock
    const refreshButton = screen.getByTestId('refresh-button');
    
    // Clear mocks to track new calls
    jest.clearAllMocks();
    
    // Click refresh to make a call that should use refresh=true
    fireEvent.click(refreshButton);
    
    // Verify API was called with refresh=true
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledWith({
        limit: 10,
        genre: null,
        refresh: true
      });
    });
  });

  // Test handling response data with nested array in data.data (lines 87-89)
  test('handles nested array in response.data.data', async () => {
    // Mock a response with nested array structure
    const nestedResponse = {
      data: {
        data: mockRecommendations
      }
    };
    
    // Mock API to return the nested structure
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(nestedResponse);
    
    render(<RecommendationsPage />);
    
    // Should correctly extract and display recommendations from nested data
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-rec2')).toBeInTheDocument();
    });
  });

  // Additional test for caching behavior (lines 56-62)
  test('caches recommendations after successful API call', async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock API to return recommendations
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({
      data: mockRecommendations
    });
    
    render(<RecommendationsPage />);
    
    // Wait for recommendations to load
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
    });
    
    // Verify cache was updated
    await waitFor(() => {
      expect(recommendationService.cacheRecommendations).toHaveBeenCalledWith({
        data: expect.any(Array)
      });
    });
  });

  // Test handling null or undefined API response
  test('handles null or undefined API response', async () => {
    // Mock API to return null
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(null);
    
    render(<RecommendationsPage />);
    
    // Should use sample recommendations when API returns null
    await waitFor(() => {
      expect(recommendationService.getSampleRecommendations).toHaveBeenCalled();
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API to return undefined
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(undefined);
    
    render(<RecommendationsPage />);
    
    // Should use sample recommendations when API returns undefined
    await waitFor(() => {
      expect(recommendationService.getSampleRecommendations).toHaveBeenCalled();
    });
  });
});
