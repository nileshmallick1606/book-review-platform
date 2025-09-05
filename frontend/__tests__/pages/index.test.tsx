import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../pages/index';
import { useAuth } from '../../store';
import recommendationService from '../../services/recommendationService';

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href} data-testid={`link-${href.replace(/\//g, '-')}`}>{children}</a>;
    },
  };
});

// Mock useAuth
jest.mock('../../store', () => ({
  useAuth: jest.fn(),
}));

// Mock recommendation service
jest.mock('../../services/recommendationService', () => ({
  getRecommendations: jest.fn(),
  getCachedRecommendations: jest.fn(),
  cacheRecommendations: jest.fn(),
  getSampleRecommendations: jest.fn()
}));

// Mock RecommendationList component
jest.mock('../../components/recommendation/RecommendationList', () => {
  return {
    __esModule: true,
    default: ({ recommendations, isLoading, error, onRefresh }: any) => {
      return (
        <div data-testid="recommendation-list">
          {isLoading && <div data-testid="loading">Loading recommendations...</div>}
          {error && <div data-testid="error">{error}</div>}
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

describe('Home Page', () => {
  const mockLogout = jest.fn();
  const mockSampleRecommendations = [
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
    // Reset mocks
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({ 
      data: mockSampleRecommendations 
    });
    (recommendationService.getCachedRecommendations as jest.Mock).mockReturnValue(null);
    (recommendationService.getSampleRecommendations as jest.Mock).mockReturnValue(mockSampleRecommendations);
  });

  test('renders login and register links when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Home />);
    
    // Title should be rendered
    expect(screen.getByText('Welcome to BookReview Platform')).toBeInTheDocument();
    
    // Login and register links should be present
    expect(screen.getByTestId('link--auth-login')).toBeInTheDocument();
    expect(screen.getByTestId('link--auth-register')).toBeInTheDocument();
    
    // User greeting should not be present
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
  });

  test('renders user greeting and logout button when authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // User greeting should be present
    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
    
    // Profile and logout buttons should be present
    expect(screen.getByTestId('link--auth-profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    // Recommendation section should be present
    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-list')).toBeInTheDocument();
    
    // Wait for recommendations to load
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    });
  });

  test('logout button calls logout function', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // Click logout button
    fireEvent.click(screen.getByText('Logout'));
    
    // Verify logout function was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('fetches recommendations when authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // Wait for recommendations to be fetched
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledWith({ limit: 3 });
    });
    
    // Verify recommendations are cached
    await waitFor(() => {
      expect(recommendationService.cacheRecommendations).toHaveBeenCalledWith({
        data: mockSampleRecommendations
      });
    });
  });

  test('uses cached recommendations when available', async () => {
    const cachedRecommendations = [
      {
        id: 'cached1',
        title: 'Cached Book 1',
        author: 'Cached Author 1',
        reason: 'Cached reason 1'
      }
    ];
    
    // Set up the cache mock to return data
    (recommendationService.getCachedRecommendations as jest.Mock).mockReturnValue(cachedRecommendations);
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // API should not be called
    await waitFor(() => {
      expect(recommendationService.getRecommendations).not.toHaveBeenCalled();
      expect(screen.getByTestId('recommendation-cached1')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    });
    
    // Reset the mock call count
    (recommendationService.getRecommendations as jest.Mock).mockClear();
    
    // Click refresh button
    fireEvent.click(screen.getByTestId('refresh-button'));
    
    // Verify API called again
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    });
  });

  test('handles API error by showing error message', async () => {
    // Mock API to throw error
    (recommendationService.getRecommendations as jest.Mock).mockRejectedValue(new Error('API error'));
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error').textContent).toBe('Failed to load recommendations.');
    });
  });

  test('handles different API response structures', async () => {
    // Test with different response structure
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({
      data: {
        data: mockSampleRecommendations
      }
    });
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // Wait for recommendations to load
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalled();
    });
    
    // Check if recommendations are displayed
    expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-rec2')).toBeInTheDocument();
  });

  test('handles visibility change when document becomes visible', async () => {
    // Mock document visibility API
    const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: jest.fn().mockReturnValue('hidden'),
    });
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user1', name: 'John Doe' },
      logout: mockLogout,
    });

    render(<Home />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    });
    
    // Reset mock
    (recommendationService.getRecommendations as jest.Mock).mockClear();
    
    // Change visibility state to visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: jest.fn().mockReturnValue('visible'),
    });
    
    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));
    
    // Check if recommendations are fetched again
    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(1);
    });
    
    // Restore original property descriptor
    if (originalVisibilityState) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityState);
    }
  });

  test('does not fetch recommendations when visibility changes but not authenticated', () => {
    // Mock document visibility API
    const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: jest.fn().mockReturnValue('hidden'),
    });
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Home />);
    
    // Reset mock
    (recommendationService.getRecommendations as jest.Mock).mockClear();
    
    // Change visibility state to visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: jest.fn().mockReturnValue('visible'),
    });
    
    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));
    
    // Recommendations should not be fetched
    expect(recommendationService.getRecommendations).not.toHaveBeenCalled();
    
    // Restore original property descriptor
    if (originalVisibilityState) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityState);
    }
  });
});
