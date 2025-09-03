/**
 * OpenAI API Service
 * 
 * Provides methods to interact with the OpenAI API with error handling and retry logic
 */

const axios = require('axios');
const openaiConfig = require('../config/openai');

class OpenAIService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiConfig.apiKey}`
      },
      timeout: openaiConfig.request.timeout
    });
    
    // Request cache storage
    this.cache = new Map();
    
    // Request counter for rate limiting
    this.requestCounter = 0;
    this.resetTime = Date.now() + 60000; // Reset counter every minute
  }
  
  /**
   * Makes a request to OpenAI API with retry logic and rate limiting
   * 
   * @param {Object} payload - Request payload for OpenAI
   * @param {String} endpoint - API endpoint (default: '/chat/completions')
   * @returns {Promise<Object>} OpenAI response data
   */
  async makeRequest(payload, endpoint = '/chat/completions') {
    // Generate cache key based on payload
    const cacheKey = this._generateCacheKey(payload, endpoint);
    
    // Check cache if enabled
    if (openaiConfig.cache.enabled) {
      const cachedResponse = this._getFromCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Apply rate limiting
    await this._checkRateLimit();
    
    let retries = 0;
    let delay = openaiConfig.rateLimit.retryDelay;
    
    while (retries <= openaiConfig.rateLimit.maxRetries) {
      try {
        const response = await this.client.post(endpoint, payload);
        
        // Save successful response to cache
        if (openaiConfig.cache.enabled) {
          this._saveToCache(cacheKey, response.data);
        }
        
        return response.data;
      } catch (error) {
        retries++;
        
        // If we've reached max retries, throw the error
        if (retries > openaiConfig.rateLimit.maxRetries) {
          throw this._handleError(error);
        }
        
        // If we should retry based on error type
        if (this._shouldRetry(error)) {
          // Apply exponential backoff
          delay = delay * openaiConfig.rateLimit.backoffFactor;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-retryable error
          throw this._handleError(error);
        }
      }
    }
  }
  
  /**
   * Create a completion with the OpenAI API
   * 
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options to override defaults
   * @returns {Promise<Object>} Completion response
   */
  async createChatCompletion(messages, options = {}) {
    const payload = {
      model: options.model || openaiConfig.model,
      messages,
      temperature: options.temperature || openaiConfig.request.temperature,
      max_tokens: options.maxTokens || openaiConfig.request.maxTokens,
      ...options
    };
    
    return this.makeRequest(payload);
  }
  
  /**
   * Validate the OpenAI API connection
   * 
   * @returns {Promise<boolean>} True if connection is valid
   */
  async validateConnection() {
    try {
      // Simple test prompt
      const messages = [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Test connection' }
      ];
      
      await this.createChatCompletion(messages, { maxTokens: 5 });
      return true;
    } catch (error) {
      console.error('OpenAI API connection validation failed:', error.message);
      return false;
    }
  }
  
  /**
   * Handle errors from OpenAI API
   * 
   * @private
   * @param {Error} error - Error object
   * @returns {Error} Processed error with more context
   */
  _handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      const { status, data } = error.response;
      
      // Enhance error with API details
      const enhancedError = new Error(
        `OpenAI API Error (${status}): ${data.error?.message || 'Unknown error'}`
      );
      enhancedError.status = status;
      enhancedError.data = data;
      enhancedError.original = error;
      
      return enhancedError;
    } else if (error.request) {
      // The request was made but no response was received
      return new Error(`OpenAI API request timeout or network error: ${error.message}`);
    } else {
      // Something else happened while setting up the request
      return new Error(`OpenAI API client error: ${error.message}`);
    }
  }
  
  /**
   * Determine if an error should trigger a retry
   * 
   * @private
   * @param {Error} error - Error object
   * @returns {boolean} True if should retry
   */
  _shouldRetry(error) {
    // Retry on rate limiting (429) or server errors (5xx)
    if (error.response) {
      const status = error.response.status;
      return status === 429 || (status >= 500 && status < 600);
    }
    
    // Retry on network errors
    return !error.response && error.request;
  }
  
  /**
   * Check and enforce rate limits
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if we passed the reset time
    if (now > this.resetTime) {
      this.requestCounter = 0;
      this.resetTime = now + 60000; // Reset every minute
    }
    
    // Check if we've hit the limit
    if (this.requestCounter >= openaiConfig.rateLimit.maxRequests) {
      const waitTime = this.resetTime - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // After waiting, reset the counter
      this.requestCounter = 0;
      this.resetTime = Date.now() + 60000;
    }
    
    // Increment counter
    this.requestCounter++;
  }
  
  /**
   * Generate a cache key for a request
   * 
   * @private
   * @param {Object} payload - Request payload
   * @param {String} endpoint - API endpoint
   * @returns {String} Cache key
   */
  _generateCacheKey(payload, endpoint) {
    return `${endpoint}_${JSON.stringify(payload)}`;
  }
  
  /**
   * Get a response from cache
   * 
   * @private
   * @param {String} key - Cache key
   * @returns {Object|null} Cached response or null
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > openaiConfig.cache.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  }
  
  /**
   * Save a response to cache
   * 
   * @private
   * @param {String} key - Cache key
   * @param {Object} data - Response data
   */
  _saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = new OpenAIService();
