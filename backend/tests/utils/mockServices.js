// Mock for OpenAI API
const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          recommendations: [
            {
              title: 'The Great Gatsby',
              author: 'F. Scott Fitzgerald',
              reason: 'Classic novel that explores themes of wealth, love, and the American Dream.'
            },
            {
              title: 'To Kill a Mockingbird',
              author: 'Harper Lee',
              reason: 'Powerful story about racial inequality and moral growth.'
            },
            {
              title: 'Pride and Prejudice',
              author: 'Jane Austen',
              reason: 'Timeless romance novel with sharp social commentary.'
            }
          ],
          explanation: 'These books match your reading preferences based on your previous ratings and favorite genres.'
        })
      }
    }
  ]
};

/**
 * Mock OpenAI service for testing recommendation functionality
 */
const mockOpenAIService = {
  generateRecommendations: jest.fn().mockResolvedValue(mockOpenAIResponse)
};

/**
 * Error-generating mock for testing error handling
 */
const mockOpenAIServiceWithError = {
  generateRecommendations: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
};

/**
 * Generates a mock axios implementation for testing API calls
 */
const getMockAxios = () => {
  return {
    post: jest.fn().mockResolvedValue({ data: mockOpenAIResponse }),
    get: jest.fn().mockResolvedValue({ data: {} })
  };
};

module.exports = {
  mockOpenAIService,
  mockOpenAIServiceWithError,
  mockOpenAIResponse,
  getMockAxios
};
