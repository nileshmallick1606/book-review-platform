/**
 * OpenAI API Configuration
 * 
 * This module provides configuration settings for OpenAI API integration
 */

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const openaiConfig = {
  // API key should be stored in environment variables for security
  apiKey: process.env.OPENAI_API_KEY || '',
  
  // Model configuration
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  
  // Rate limiting configuration
  rateLimit: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    maxRequests: 20, // Maximum requests per minute
    backoffFactor: 1.5, // Exponential backoff factor for retries
  },
  
  // Request configuration
  request: {
    timeout: 30000, // 30 seconds timeout
    temperature: 0.7, // Controls randomness (0-1)
    maxTokens: 500, // Maximum tokens to generate
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours cache TTL in milliseconds
  }
};

module.exports = openaiConfig;
