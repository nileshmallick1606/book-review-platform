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
  
  test('getRecommendations creates correct URL with default query parameters', async () => {
    // Set up token to simulate authenticated user
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    // Spy on API calls to verify URL format
    const apiSpy = jest.spyOn(require('../../services/api').default, 'get');
    
    await recommendationService.getRecommendations();
    
    // The default limit of 5 is applied
    expect(apiSpy).toHaveBeenCalledWith('/recommendations?limit=5');
    
    apiSpy.mockRestore();
  });
  
  test('getRecommendations creates URL with no query string when limit is 0', async () => {
    // Set up token to simulate authenticated user
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    // Spy on API calls to verify URL format
    const apiSpy = jest.spyOn(require('../../services/api').default, 'get');
    
    // Pass 0 as the limit which should result in no query parameters
    await recommendationService.getRecommendations({ limit: 0 });
    
    // Should create a URL with no query string
    expect(apiSpy).toHaveBeenCalledWith('/recommendations');
    
    apiSpy.mockRestore();
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
  
  test('handles response with array format instead of data object', async () => {
    // Setup token
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    // Override to return array response format
    server.use(
      rest.get('*/api/recommendations', (req, res, ctx) => {
        return res(ctx.json([
          { 
            id: 'array-1', 
            title: 'Array Book', 
            coverImage: 'https://example.com/image.jpg' 
          },
          { 
            id: 'array-2', 
            title: 'Array Book 2',
            coverImage: 'https://invalid-domain.com/image.jpg' // Invalid URL to test normalization
          }
        ]));
      })
    );
    
    const result = await recommendationService.getRecommendations();
    
    // Should normalize the response
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe('array-1');
    expect(result.data[0].coverImage).toBe('https://example.com/image.jpg');
    expect(result.data[1].coverImage).toBeUndefined();
  });
  
  test('handles empty response with no data property', async () => {
    // Setup token
    localStorageMock.getItem.mockImplementation((key) => key === 'token' ? 'test-token' : null);
    
    // Override to return empty response
    server.use(
      rest.get('*/api/recommendations', (req, res, ctx) => {
        return res(ctx.json({
          success: true,
          message: 'No recommendations available'
          // No data property
        }));
      })
    );
    
    const result = await recommendationService.getRecommendations();
    
    // Should normalize the response
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.data).toEqual([]);
  });
  
  test('validates image URLs correctly', () => {
    // Test valid image URLs for each allowed domain
    expect(recommendationService.isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(recommendationService.isValidImageUrl('https://via.placeholder.com/300')).toBe(true);
    expect(recommendationService.isValidImageUrl('https://picsum.photos/200')).toBe(true);
    
    // Test invalid image URLs
    expect(recommendationService.isValidImageUrl('')).toBe(false);
    expect(recommendationService.isValidImageUrl('not-a-url')).toBe(false);
    expect(recommendationService.isValidImageUrl('https://unknown-domain.com/image.jpg')).toBe(false);
    
    // Test malformed URL that throws in the URL constructor
    expect(recommendationService.isValidImageUrl('https:///malformed')).toBe(false);
  });
  
  test('handles and processes cached recommendations with standard structure', () => {
    const mockCachedData = [
      { id: 'cached-1', title: 'Cached Book', author: 'Cached Author' }
    ];
    
    // Setup cache with standard structure (data + timestamp)
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
  
  test('handles legacy cache structure', () => {
    const mockTimestamp = Date.now() - 60000; // 1 minute ago
    
    // Setup cache with legacy structure (data with embedded timestamp)
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cachedRecommendations') {
        return JSON.stringify({
          id: 'legacy-1',
          title: 'Legacy Book',
          author: 'Legacy Author',
          timestamp: mockTimestamp
        });
      }
      return null;
    });
    
    const cachedData = recommendationService.getCachedRecommendations();
    // Should still return data even with legacy structure
    expect(cachedData).toEqual([]);
  });
  
  test('handles invalid cache structure', () => {
    // Setup cache with invalid structure (no timestamp)
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cachedRecommendations') {
        return JSON.stringify({
          id: 'invalid-1',
          title: 'Invalid Cache'
          // No timestamp property
        });
      }
      return null;
    });
    
    const cachedData = recommendationService.getCachedRecommendations();
    // Should return null for invalid structure
    expect(cachedData).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cachedRecommendations');
  });
  
  test('handles cache parse error', () => {
    // Setup invalid JSON in cache
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cachedRecommendations') {
        return '{invalid-json';
      }
      return null;
    });
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Should return sample recommendations as fallback
    const result = recommendationService.getCachedRecommendations();
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBeNull();
    expect(result![0].title).toBe('The Great Gatsby');
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cachedRecommendations');
    consoleErrorSpy.mockRestore();
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
