/**
 * Tests for OpenAI Service
 */

const openaiService = require('../../src/services/openai.service');
const openaiConfig = require('../../src/config/openai');

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      post: jest.fn()
    }))
  };
});

describe('OpenAI Service', () => {
  let mockClient;
  
  beforeEach(() => {
    // Reset the mock and set up client
    jest.clearAllMocks();
    mockClient = openaiService.client;
    mockClient.post.mockReset();
  });
  
  describe('createChatCompletion', () => {
    it('should call OpenAI API with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          id: 'test-id',
          choices: [{ message: { content: 'Test response' } }]
        }
      };
      mockClient.post.mockResolvedValue(mockResponse);
      
      // Test messages
      const messages = [
        { role: 'system', content: 'You are a book recommendation assistant.' },
        { role: 'user', content: 'Recommend me a science fiction book.' }
      ];
      
      // Call the service
      await openaiService.createChatCompletion(messages);
      
      // Check if API was called with correct parameters
      expect(mockClient.post).toHaveBeenCalledWith('/chat/completions', {
        model: openaiConfig.model,
        messages,
        temperature: openaiConfig.request.temperature,
        max_tokens: openaiConfig.request.maxTokens
      });
    });
    
    it('should override default parameters when options are provided', async () => {
      // Mock successful response
      mockClient.post.mockResolvedValue({
        data: { id: 'test-id', choices: [{ message: { content: 'Custom response' } }] }
      });
      
      // Test messages and options
      const messages = [{ role: 'user', content: 'Test' }];
      const options = {
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 100
      };
      
      // Call the service
      await openaiService.createChatCompletion(messages, options);
      
      // Check if API was called with overridden parameters
      expect(mockClient.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'gpt-4',
        messages,
        temperature: 0.2,
        max_tokens: 100
      });
    });
  });
  
  describe('Error handling', () => {
    it('should retry on rate limiting errors', async () => {
      // Mock rate limit error response
      const rateLimitError = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } }
        }
      };
      
      // Mock successful response after retry
      const successResponse = {
        data: { id: 'test-id', choices: [{ message: { content: 'Success after retry' } }] }
      };
      
      // First call fails with rate limit, second succeeds
      mockClient.post
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResponse);
      
      // Test messages
      const messages = [{ role: 'user', content: 'Test retry' }];
      
      // Call the service
      const result = await openaiService.createChatCompletion(messages);
      
      // Check if API was called twice (initial + retry)
      expect(mockClient.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual(successResponse.data);
    });
    
    it('should throw enhanced error after max retries', async () => {
      // Mock persistent server error
      const serverError = {
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } }
        }
      };
      
      // All calls fail
      mockClient.post.mockRejectedValue(serverError);
      
      // Test messages
      const messages = [{ role: 'user', content: 'Test max retries' }];
      
      // Call the service and expect it to throw
      await expect(openaiService.createChatCompletion(messages))
        .rejects
        .toThrow(/OpenAI API Error \(500\): Internal server error/);
      
      // Check if API was called maxRetries + 1 times
      expect(mockClient.post).toHaveBeenCalledTimes(openaiConfig.rateLimit.maxRetries + 1);
    });
  });
  
  describe('Caching', () => {
    beforeEach(() => {
      // Clear cache
      openaiService.cache.clear();
    });
    
    it('should return cached response when available', async () => {
      // Only if cache is enabled
      if (!openaiConfig.cache.enabled) {
        return;
      }
      
      // Mock successful response
      const mockResponse = {
        data: {
          id: 'cache-test',
          choices: [{ message: { content: 'Cached response' } }]
        }
      };
      mockClient.post.mockResolvedValue(mockResponse);
      
      // Test messages
      const messages = [{ role: 'user', content: 'Test cache' }];
      
      // First call should hit the API
      await openaiService.createChatCompletion(messages);
      expect(mockClient.post).toHaveBeenCalledTimes(1);
      
      // Second call with same parameters should use cache
      await openaiService.createChatCompletion(messages);
      expect(mockClient.post).toHaveBeenCalledTimes(1); // Still just one call
    });
  });
});
