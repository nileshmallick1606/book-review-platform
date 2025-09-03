/**
 * Recommendation Service
 * 
 * Generates personalized book recommendations using OpenAI API and user preferences
 */

const openaiService = require('./openai.service');
const preferenceService = require('./preference.service');
const bookModel = require('../models/book.model');
const userModel = require('../models/user.model');

class RecommendationService {
  constructor() {
    this.bookModel = bookModel;
    this.userModel = userModel;
    
    // Cache for recommendations
    this.recommendationCache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }
  
  /**
   * Get personalized book recommendations for a user
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Optional parameters
   * @param {number} options.limit - Number of recommendations to return (default: 5)
   * @param {string} options.genre - Filter by genre
   * @param {boolean} options.forceRefresh - Force regeneration of recommendations
   * @returns {Promise<Array>} Array of recommended books with explanation
   */
  async getRecommendationsForUser(userId, options = {}) {
    const { limit = 5, genre = null, forceRefresh = false } = options;
    
    try {
      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cachedRecommendations = this._getFromCache(userId, genre);
        if (cachedRecommendations) {
          return this._filterRecommendations(cachedRecommendations, limit, genre);
        }
      }
      
      // Get user data
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Get user preferences
      const preferences = await preferenceService.getUserPreferences(userId);
      
      // Generate recommendations based on preferences
      const recommendations = await this._generateRecommendations(user, preferences);
      
      // Cache the recommendations
      this._saveToCache(userId, recommendations);
      
      // Filter and return recommendations
      return this._filterRecommendations(recommendations, limit, genre);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to default recommendations
      return this._getDefaultRecommendations(limit, genre);
    }
  }
  
  /**
   * Generate recommendations using OpenAI API based on user preferences
   * 
   * @private
   * @param {Object} user - User object
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Array of recommendations
   */
  async _generateRecommendations(user, preferences) {
    try {
      // Prepare a prompt for OpenAI
      const prompt = this._constructPrompt(user, preferences);
      
      // Call OpenAI API
      const response = await openaiService.createChatCompletion([
        { role: 'system', content: 'You are a book recommendation assistant with extensive knowledge of literature. Provide thoughtful, personalized book recommendations based on user preferences. Focus on books that match the user\'s interests but that they might not have discovered yet.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        maxTokens: 1000
      });
      
      // Parse the response
      const recommendations = this._parseOpenAIResponse(response);
      
      // Fetch book details and enhance recommendations
      return this._enhanceRecommendations(recommendations);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
  
  /**
   * Construct a prompt for OpenAI based on user preferences
   * 
   * @private
   * @param {Object} user - User object
   * @param {Object} preferences - User preferences
   * @returns {string} Prompt for OpenAI
   */
  _constructPrompt(user, preferences) {
    // Extract top genres and authors
    const topGenres = preferences.genres.slice(0, 3).map(g => g.genre).join(', ');
    const topAuthors = preferences.authors.slice(0, 3).map(a => a.author).join(', ');
    const favoriteThemes = preferences.favoriteThemes
      ? preferences.favoriteThemes.slice(0, 3).map(t => t.theme).join(', ')
      : '';
    
    // Get rating pattern
    const ratingBias = preferences.ratingPattern?.ratingBias || 'neutral';
    const averageRating = preferences.ratingPattern?.averageRating || 0;
    
    // Build the prompt
    let prompt = `Recommend 10 books for a reader with the following preferences:

- Favorite genres: ${topGenres || 'Various'}
- Favorite authors: ${topAuthors || 'Various'}
- Interested in themes: ${favoriteThemes || 'Various'}
- Rating style: ${ratingBias} (average rating: ${averageRating.toFixed(1)}/5)
- Preferred publication era: ${preferences.publicationEra?.preferredEra || 'any'}

Return your response in JSON format with the following structure:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Primary Genre",
    "year": publication year (number),
    "reason": "Brief explanation of why this book is recommended based on the user's preferences"
  }
]

Make sure the books match the user's genre preferences and reading style. Include both well-known and lesser-known books that they might enjoy. Don't recommend books that are too far outside their interest areas.`;

    return prompt;
  }
  
  /**
   * Parse the response from OpenAI API
   * 
   * @private
   * @param {Object} response - OpenAI API response
   * @returns {Array} Parsed recommendations
   */
  _parseOpenAIResponse(response) {
    try {
      // Extract content from response
      const content = response.choices[0].message.content;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        // If not in proper JSON format, try a more lenient approach
        const lines = content.split('\n');
        const recommendations = [];
        
        let currentRec = null;
        
        for (const line of lines) {
          if (line.includes('Title:') || line.includes('"title":')) {
            // Start a new recommendation
            if (currentRec) recommendations.push(currentRec);
            currentRec = { title: line.split(':')[1]?.trim().replace(/"/g, '') };
          } else if (currentRec) {
            if (line.includes('Author:') || line.includes('"author":')) {
              currentRec.author = line.split(':')[1]?.trim().replace(/"/g, '');
            } else if (line.includes('Genre:') || line.includes('"genre":')) {
              currentRec.genre = line.split(':')[1]?.trim().replace(/"/g, '');
            } else if (line.includes('Year:') || line.includes('"year":')) {
              const yearMatch = line.match(/\d{4}/);
              if (yearMatch) currentRec.year = parseInt(yearMatch[0]);
            } else if (line.includes('Reason:') || line.includes('"reason":') || line.includes('Why:')) {
              currentRec.reason = line.split(':').slice(1).join(':').trim().replace(/"/g, '');
            }
          }
        }
        
        // Add the last recommendation if exists
        if (currentRec) recommendations.push(currentRec);
        
        return recommendations;
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return [];
    }
  }
  
  /**
   * Enhance recommendations with book details from database
   * 
   * @private
   * @param {Array} recommendations - Raw recommendations
   * @returns {Promise<Array>} Enhanced recommendations
   */
  async _enhanceRecommendations(recommendations) {
    // Get all books
    const allBooks = await this.bookModel.findAll();
    
    // Enhanced recommendations array
    const enhancedRecommendations = [];
    
    // Process each recommendation
    for (const recommendation of recommendations) {
      // Try to find a matching book in our database
      const matchingBook = this._findMatchingBook(recommendation, allBooks);
      
      if (matchingBook) {
        // If found in database, use our data but keep the reason
        enhancedRecommendations.push({
          ...matchingBook,
          reason: recommendation.reason || 'This book matches your reading preferences.'
        });
      } else {
        // If not found, use the recommendation as is
        enhancedRecommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: recommendation.title,
          author: recommendation.author,
          genres: recommendation.genre ? [recommendation.genre] : [],
          publishedYear: recommendation.year || null,
          description: '',
          coverImage: '',
          reason: recommendation.reason || 'This book matches your reading preferences.',
          source: 'recommendation'
        });
      }
    }
    
    return enhancedRecommendations;
  }
  
  /**
   * Find a matching book in our database
   * 
   * @private
   * @param {Object} recommendation - Recommendation from OpenAI
   * @param {Array} books - Books from our database
   * @returns {Object|null} Matching book or null
   */
  _findMatchingBook(recommendation, books) {
    // Find by exact title and author match
    const exactMatch = books.find(book => 
      book.title.toLowerCase() === recommendation.title.toLowerCase() &&
      book.author.toLowerCase() === recommendation.author.toLowerCase()
    );
    
    if (exactMatch) return exactMatch;
    
    // Find by title similarity
    const titleMatches = books.filter(book => 
      book.title.toLowerCase().includes(recommendation.title.toLowerCase()) ||
      recommendation.title.toLowerCase().includes(book.title.toLowerCase())
    );
    
    if (titleMatches.length === 1) return titleMatches[0];
    
    // If multiple title matches, try to narrow down by author
    if (titleMatches.length > 1) {
      const authorMatch = titleMatches.find(book => 
        book.author.toLowerCase().includes(recommendation.author.toLowerCase()) ||
        recommendation.author.toLowerCase().includes(book.author.toLowerCase())
      );
      
      if (authorMatch) return authorMatch;
    }
    
    // No match found
    return null;
  }
  
  /**
   * Get default recommendations (top-rated books)
   * 
   * @private
   * @param {number} limit - Number of recommendations
   * @param {string} genre - Filter by genre
   * @returns {Promise<Array>} Default recommendations
   */
  async _getDefaultRecommendations(limit, genre) {
    try {
      // Get all books
      let books = await this.bookModel.findAll();
      
      // Filter by genre if specified
      if (genre) {
        books = books.filter(book => 
          book.genres && book.genres.some(g => g.toLowerCase() === genre.toLowerCase())
        );
      }
      
      // Sort by average rating (descending)
      books.sort((a, b) => b.averageRating - a.averageRating);
      
      // Return top books with generic reasons
      return books.slice(0, limit).map(book => ({
        ...book,
        reason: 'This is one of our top-rated books that many readers enjoy.'
      }));
    } catch (error) {
      console.error('Error getting default recommendations:', error);
      return [];
    }
  }
  
  /**
   * Filter recommendations based on limit and genre
   * 
   * @private
   * @param {Array} recommendations - Recommendations to filter
   * @param {number} limit - Maximum number of recommendations
   * @param {string} genre - Genre to filter by
   * @returns {Array} Filtered recommendations
   */
  _filterRecommendations(recommendations, limit, genre) {
    // Filter by genre if specified
    let filtered = recommendations;
    
    if (genre) {
      filtered = filtered.filter(rec => {
        if (!rec.genres) return false;
        return rec.genres.some(g => g.toLowerCase() === genre.toLowerCase());
      });
    }
    
    // Limit the number of recommendations
    return filtered.slice(0, limit);
  }
  
  /**
   * Get recommendations from cache
   * 
   * @private
   * @param {string} userId - User ID
   * @param {string} genre - Genre filter
   * @returns {Array|null} Cached recommendations or null
   */
  _getFromCache(userId, genre) {
    const cacheKey = this._getCacheKey(userId, genre);
    const cached = this.recommendationCache.get(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > this.cacheTTL) {
      this.recommendationCache.delete(cacheKey);
      return null;
    }
    
    return data;
  }
  
  /**
   * Save recommendations to cache
   * 
   * @private
   * @param {string} userId - User ID
   * @param {Array} recommendations - Recommendations to cache
   */
  _saveToCache(userId, recommendations) {
    const cacheKey = this._getCacheKey(userId);
    
    this.recommendationCache.set(cacheKey, {
      data: recommendations,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generate cache key
   * 
   * @private
   * @param {string} userId - User ID
   * @param {string} genre - Genre filter
   * @returns {string} Cache key
   */
  _getCacheKey(userId, genre = null) {
    return `${userId}${genre ? '_' + genre : ''}`;
  }
}

module.exports = new RecommendationService();
