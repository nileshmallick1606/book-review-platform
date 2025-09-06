import api from './api';

/**
 * Service for fetching book recommendations
 */
export const recommendationService = {
  /**
   * Get personalized recommendations for the authenticated user
   * 
   * @param {Object} options - Request options
   * @param {number} options.limit - Maximum number of recommendations
   * @param {string} options.genre - Filter by genre
   * @param {boolean} options.refresh - Force refresh recommendations
   * @returns {Promise<Object>} Recommendation response
   */
  async getRecommendations(options: { limit?: number; genre?: string | null; refresh?: boolean } = {}) {
    const { limit = 5, genre = null, refresh = false } = options;
    
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (limit) queryParams.append('limit', limit.toString());
    if (genre) queryParams.append('genre', genre);
    queryParams.append('refresh', 'true');
    
    const query = queryParams.toString();
    const url = `/recommendations${query ? '?' + query : ''}`;
    
    try {
      // Ensure we have a token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        // Return sample recommendations if not authenticated
        return this.getSampleRecommendationResponseData();
      }
      
      const response = await api.get(url);
      
      // Process the data to ensure all recommendation books have valid cover images
      if (response.data && response.data.data) {
        // This is the expected structure from our backend API
        response.data.data = response.data.data.map((book: any) => {
          // If no cover image or invalid URL, set to undefined so our component fallback works
          if (!book.coverImage || !this.isValidImageUrl(book.coverImage)) {
            book.coverImage = undefined;
          }
          return book;
        });
      } else if (response.data && Array.isArray(response.data)) {
        // Alternative structure, API might return array directly
        response.data = {
          success: true,
          count: response.data.length,
          data: response.data.map((book: any) => {
            if (!book.coverImage || !this.isValidImageUrl(book.coverImage)) {
              book.coverImage = undefined;
            }
            return book;
          })
        };
      } else if (response.data && !response.data.data) {
        // Handle empty results case explicitly
        return this.getSampleRecommendationResponseData();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      
      // Instead of throwing, return sample recommendations
      return this.getSampleRecommendationResponseData();
    }
  },

  getSampleRecommendationResponseData() {
    return {
          success: true,
          count: this.getSampleRecommendations().length,
          data: this.getSampleRecommendations()
        };

  },
  
  /**
   * Validates if an image URL is from an allowed domain
   * 
   * @param {string} url - Image URL to validate
   * @returns {boolean} Whether URL is valid
   */
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    try {
      const hostname = new URL(url).hostname;
      const allowedHosts = ['example.com', 'via.placeholder.com', 'picsum.photos'];
      return allowedHosts.includes(hostname);
    } catch {
      return false;
    }
  },
  
  /**
   * Get cached recommendation data
   * 
   * @returns {Array|null} Cached recommendations array or null
   */
  getCachedRecommendations(): any[] | null {
    try {
      const cached = localStorage.getItem('cachedRecommendations');
      if (!cached) {
        return null;
      }
      
      const parsedCache = JSON.parse(cached);
      
      // Handle potentially different cache structures
      let data, timestamp;
      
      if (parsedCache.data && parsedCache.timestamp) {
        // Standard structure
        ({ data, timestamp } = parsedCache);
      } else if (parsedCache.timestamp) {
        // Legacy structure
        data = parsedCache;
        timestamp = parsedCache.timestamp;
      } else {
        // Invalid structure
        localStorage.removeItem('cachedRecommendations');
        return null;
      }
      
      const now = Date.now();
      
      // Check if cache is valid (less than 24 hours old)
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        // Ensure we return an array
        return Array.isArray(data) ? data : [];
      }
      
      // Cache expired
      localStorage.removeItem('cachedRecommendations');
      return null;
    } catch (error) {
      // Error reading cache
      localStorage.removeItem('cachedRecommendations');
      
      // Return sample recommendations as fallback
      return this.getSampleRecommendations();
    }
  },
  
  /**
   * Cache recommendation data
   * 
   * @param {Object} data - Recommendation data to cache
   */
  cacheRecommendations(data: any) {
    try {
      localStorage.setItem('cachedRecommendations', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  },
  
  /**
   * Get sample recommendations when API fails or returns empty
   * This provides a fallback to show something to users even when real recommendations fail
   * 
   * @returns {Array} Sample recommendations
   */
  getSampleRecommendations() {
    return [
      {
        id: 'sample-1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        coverImage: 'https://via.placeholder.com/120x180/e9e9e9/333333?text=Great+Gatsby',
        reason: 'Classic novel about the American Dream in the 1920s',
        genres: ['Fiction', 'Classics', 'Literary Fiction']
      },
      {
        id: 'sample-2',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverImage: 'https://via.placeholder.com/120x180/e9e9e9/333333?text=Mockingbird',
        reason: 'Powerful story about racial injustice and moral growth',
        genres: ['Fiction', 'Classics', 'Coming of Age']
      },
      {
        id: 'sample-3',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        coverImage: 'https://via.placeholder.com/120x180/e9e9e9/333333?text=Hobbit',
        reason: 'Fantasy adventure that has captivated readers for generations',
        genres: ['Fantasy', 'Adventure', 'Fiction']
      }
    ];
  }
};

export default recommendationService;
