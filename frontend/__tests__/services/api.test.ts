// __tests__/services/api.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Define mock functions before module imports
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockRequestUse = jest.fn();
const mockResponseUse = jest.fn();
const mockCreate = jest.fn();

// Mock axios
jest.mock('axios', () => ({
  create: mockCreate
}));

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
  value: localStorageMock
});

describe('API Service', () => {
  // Store captured interceptors
  let requestInterceptor: any;
  let responseInterceptor: any;
  let errorInterceptor: any;
  
  beforeEach(() => {
    // Reset mocks and state
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Setup mock axios instance
    mockCreate.mockReturnValue({
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse }
      },
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete
    });
    
    // Capture interceptor functions when they're registered
    mockRequestUse.mockImplementation((fn: any) => {
      requestInterceptor = fn;
      return { eject: jest.fn() };
    });
    
    mockResponseUse.mockImplementation((successFn: any, errorFn: any) => {
      responseInterceptor = successFn;
      errorInterceptor = errorFn;
      return { eject: jest.fn() };
    });
    
    // Import the API module fresh for each test
    jest.resetModules();
    require('../../services/api');
  });

  test('axios instance is configured with correct defaults', () => {
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: expect.any(String),
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      withCredentials: true,
    }));
  });

  test('request interceptor adds auth token if present', () => {
    // Mock localStorage to return a token
    localStorageMock.getItem.mockReturnValueOnce('test-token');
    
    // Call the interceptor with a config object
    const config = { headers: {} };
    const result = requestInterceptor(config);
    
    // Verify it added the authorization header
    expect(result.headers.Authorization).toBe('Bearer test-token');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
  });

  test('response error interceptor removes token on 401 errors', async () => {
    // Create a 401 error
    const error = { response: { status: 401 } };
    
    // Call the interceptor and expect it to reject
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    
    // Verify token was removed - this is the main behavior we want to test
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    
    // Note: We're not testing window.location.assign behavior here
    // because it's problematic to mock in Jest
  });

  test('response error interceptor passes through other errors', async () => {
    // Create a non-401 error
    const error = { response: { status: 500 } };
    
    // Call the interceptor and expect it to reject
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    
    // Verify token was NOT removed
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });
  
  test('api.get makes successful request', async () => {
    // Setup mock response
    const mockResponse = { data: { success: true } };
    mockGet.mockImplementation(() => Promise.resolve(mockResponse));
    
    // Import api and make request
    const api = require('../../services/api').default;
    const result = await api.get('/test');
    
    // Verify get was called with the right path
    expect(mockGet).toHaveBeenCalledWith('/test');
    expect(result).toEqual(mockResponse);
  });
  
  test('api methods handle errors', async () => {
    // Setup mock to reject
    const testError = new Error('Request failed');
    mockGet.mockImplementation(() => Promise.reject(testError));
    
    // Import api
    const api = require('../../services/api').default;
    
    // Verify it rejects with the same error
    await expect(api.get('/error')).rejects.toThrow('Request failed');
  });

  test('api.post makes successful request', async () => {
    // Setup mock response
    const mockResponse = { data: { id: 123 } };
    mockPost.mockImplementation(() => Promise.resolve(mockResponse));
    
    // Import api and make request
    const api = require('../../services/api').default;
    const data = { name: 'test' };
    const result = await api.post('/create', data);
    
    // Verify post was called with the right path and data
    expect(mockPost).toHaveBeenCalledWith('/create', data);
    expect(result).toEqual(mockResponse);
  });

  test('api.put makes successful request', async () => {
    // Setup mock response
    const mockResponse = { data: { updated: true } };
    mockPut.mockImplementation(() => Promise.resolve(mockResponse));
    
    // Import api and make request
    const api = require('../../services/api').default;
    const data = { name: 'updated' };
    const result = await api.put('/update/123', data);
    
    // Verify put was called with the right path and data
    expect(mockPut).toHaveBeenCalledWith('/update/123', data);
    expect(result).toEqual(mockResponse);
  });

  test('api.delete makes successful request', async () => {
    // Setup mock response
    const mockResponse = { data: { deleted: true } };
    mockDelete.mockImplementation(() => Promise.resolve(mockResponse));
    
    // Import api and make request
    const api = require('../../services/api').default;
    const result = await api.delete('/delete/123');
    
    // Verify delete was called with the right path
    expect(mockDelete).toHaveBeenCalledWith('/delete/123');
    expect(result).toEqual(mockResponse);
  });
});
