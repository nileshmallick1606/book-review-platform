/**
 * Tests for OpenAI Integration Service
 */

const openaiService = require('../../src/services/openai.service');
const { Configuration, OpenAIApi } = require('openai');

// Mock OpenAI API
jest.mock('openai', () => {
  return {
    Configuration: jest.fn(),
    OpenAIApi: jest.fn().mockImplementation(() => {
      return {
        createChatCompletion: jest.fn()
      };
    })
  };
});

describe('OpenAI Service', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    model: 'gpt-3.5-turbo',
    maxRetries: 3
  };

  const mockCompletionResponse = {
    data: {
      id: 'test-completion-id',
      choices: [
        {
          message: {
            content: 'This is a test response'
          }
        }
      ]
    }
  };

  const mockErrorResponse = {
    response: {
      status: 429,
      data: {
        error: {
          message: 'Rate limit exceeded'
        }
      }
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup process.env mock
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
    
    // Set mock implementation for createChatCompletion
    const mockApi = new OpenAIApi();
    mockApi.createChatCompletion.mockResolvedValue(mockCompletionResponse);
  });

  describe('createChatCompletion', () => {
    test('should successfully call the OpenAI API and return response', async () => {
      const messages = [
        { role: 'system', content: 'You are a book recommendation assistant.' },
        { role: 'user', content: 'Recommend science fiction books.' }
      ];
      
      const result = await openaiService.createChatCompletion(messages);
      
      expect(result).toBeDefined();
      expect(result.choices[0].message.content).toBe('This is a test response');
      
      // Check if OpenAI API was called with correct parameters
      const mockOpenAI = new OpenAIApi();
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });
    });

    test('should retry on rate limit errors', async () => {
      const messages = [
        { role: 'system', content: 'You are a book recommendation assistant.' },
        { role: 'user', content: 'Recommend fantasy books.' }
      ];
      
      const mockOpenAI = new OpenAIApi();
      
      // First two calls fail, third succeeds
      mockOpenAI.createChatCompletion
        .mockRejectedValueOnce(mockErrorResponse)
        .mockRejectedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockCompletionResponse);
      
      const result = await openaiService.createChatCompletion(messages);
      
      expect(result).toBeDefined();
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max retries', async () => {
      const messages = [
        { role: 'system', content: 'You are a book recommendation assistant.' },
        { role: 'user', content: 'Recommend mystery books.' }
      ];
      
      const mockOpenAI = new OpenAIApi();
      
      // All calls fail
      mockOpenAI.createChatCompletion
        .mockRejectedValue(mockErrorResponse);
      
      await expect(openaiService.createChatCompletion(messages))
        .rejects
        .toThrow('OpenAI API request failed after 3 retries');
    });

    test('should handle malformed responses', async () => {
      const messages = [
        { role: 'system', content: 'You are a book recommendation assistant.' },
        { role: 'user', content: 'Recommend history books.' }
      ];
      
      const mockOpenAI = new OpenAIApi();
      
      // Return malformed response
      mockOpenAI.createChatCompletion.mockResolvedValue({
        data: {
          id: 'test-completion-id',
          // No choices array
        }
      });
      
      await expect(openaiService.createChatCompletion(messages))
        .rejects
        .toThrow('Unexpected response format from OpenAI API');
    });

    test('should handle API configuration errors', async () => {
      // Remove API key to simulate configuration error
      delete process.env.OPENAI_API_KEY;
      
      const messages = [
        { role: 'user', content: 'Recommend books.' }
      ];
      
      await expect(openaiService.createChatCompletion(messages))
        .rejects
        .toThrow('OpenAI API key is not configured');
    });
  });
});
