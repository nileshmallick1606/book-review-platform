// __tests__/services/recommendationService.test.ts
import { rest } from 'msw';
import { describe, test, expect, beforeAll, afterAll, jest, beforeEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import recommendationService from '../../services/recommendationService';
import { mockBooks } from '../mocks/data-factories';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Setup MSW server
const server = setupServer(
  rest.get('*/api/recommendations', (req, res, ctx) => {
    const mockRecommendations = mockBooks(3, { 
      reason: 'Because you liked similar books' 
    });
    
    return res(ctx.json({
      success: true,
      count: mockRecommendations.length,
      data: mockRecommendations
    }));
  })
);

// Start the server before tests
beforeAll(() => server.listen());
// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  localStorageMock.clear();
});
// Stop the server after all tests
afterAll(() => server.close());

describe('Recommendation Service', () => {
  test('getRecommendations fetches recommendations correctly', async () => {
    // Set up token to simulate authenticated user
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    const result = await recommendationService.getRecommendations();
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.data).toHaveLength(3);
  });
  
  test('getRecommendations handles query parameters', async () => {
    // Setup token
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    // Override handler to test query parameters
    server.use(
      rest.get('*/api/recommendations', (req, res, ctx) => {
        const limit = req.url.searchParams.get('limit');
        const genre = req.url.searchParams.get('genre');
        const refresh = req.url.searchParams.get('refresh');
        
        const mockData = mockBooks(Number(limit) || 3);
        
        return res(ctx.json({
          success: true,
          count: mockData.length,
          data: mockData,
          params: { limit, genre, refresh }
        }));
      })
    );
    
    const options = { limit: 5, genre: 'Mystery', refresh: true };
    const result = await recommendationService.getRecommendations(options);
    
    expect(result.count).toBe(5);
    expect(result.data).toHaveLength(5);
    expect(result.params.genre).toBe('Mystery');
    expect(result.params.refresh).toBe('true');
  });
  
  test('returns sample recommendations when not authenticated', async () => {
    // Ensure no token is present
    localStorageMock.getItem.mockImplementation(() => null);
    
    const result = await recommendationService.getRecommendations();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
    
    // Verify it's using sample data
    expect(result.data[0].title).toBe('The Great Gatsby');
  });
  
  test('returns sample recommendations on API error', async () => {
    // Setup token
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    // Override to simulate error
    server.use(
      rest.get('*/api/recommendations', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = await recommendationService.getRecommendations();
    
    // Should return fallback data
    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
  
  test('validates image URLs correctly', () => {
    // Test valid image URL
    expect(recommendationService.isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    
    // Test invalid image URLs
    expect(recommendationService.isValidImageUrl('')).toBe(false);
    expect(recommendationService.isValidImageUrl('not-a-url')).toBe(false);
    expect(recommendationService.isValidImageUrl('https://unknown-domain.com/image.jpg')).toBe(false);
  });
  
  test('handles and processes cached recommendations', () => {
    const mockCachedData = [
      { id: 'cached-1', title: 'Cached Book', author: 'Cached Author' }
    ];
    
    // Setup cache
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cachedRecommendations') {
        return JSON.stringify({
          data: mockCachedData,
          timestamp: Date.now() - 60000 // 1 minute ago
        });
      }
      return null;
    });
    
    const cachedData = recommendationService.getCachedRecommendations();
    expect(cachedData).toEqual(mockCachedData);
  });
  
  test('returns null for expired cache', () => {
    // Setup expired cache (25 hours old)
    const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cachedRecommendations') {
        return JSON.stringify({
          data: [{ id: 'expired' }],
          timestamp: expiredTimestamp
        });
      }
      return null;
    });
    
    const cachedData = recommendationService.getCachedRecommendations();
    expect(cachedData).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cachedRecommendations');
  });
  
  test('caches recommendation data correctly', () => {
    const dataToCache = [{ id: 'test-1', title: 'Test Book' }];
    
    // Capture the data that will be stored
    let storedData = '';
    localStorageMock.setItem.mockImplementationOnce((key, value) => {
      storedData = value;
    });
    
    recommendationService.cacheRecommendations(dataToCache);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cachedRecommendations',
      expect.any(String)
    );
    
    // Verify the cached data structure
    const cachedJson = JSON.parse(storedData);
    expect(cachedJson).toHaveProperty('data');
    expect(cachedJson).toHaveProperty('timestamp');
    expect(cachedJson.data).toEqual(dataToCache);
  });
  
  test('handles errors in cacheRecommendations', () => {
    // Mock localStorage.setItem to throw an error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // This should not throw despite the error
    recommendationService.cacheRecommendations([{ id: 'test' }]);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error caching recommendations:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });
});
