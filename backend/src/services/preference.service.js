/**
 * User Preference Analysis Service
 * 
 * Analyzes user preferences based on reviews, ratings, and favorite books
 */

const userModel = require('../models/user.model');
const reviewModel = require('../models/review.model');
const bookModel = require('../models/book.model');

class PreferenceService {
  constructor() {
    this.userModel = userModel;
    this.reviewModel = reviewModel;
    this.bookModel = bookModel;
  }
  
  /**
   * Get comprehensive user preference profile based on their activity
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preference profile
   */
  async getUserPreferences(userId) {
    // Get user data
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Get user reviews
    const userReviews = await this.reviewModel.findByUserId(userId);
    
    // Get favorite books
    const favoriteBookIds = user.favorites || [];
    const favoriteBooks = [];
    
    for (const bookId of favoriteBookIds) {
      const book = await this.bookModel.findById(bookId);
      if (book) favoriteBooks.push(book);
    }
    
    // Build preference profile
    const preferences = {
      genres: await this._extractGenrePreferences(userReviews, favoriteBooks),
      authors: await this._extractAuthorPreferences(userReviews, favoriteBooks),
      ratingPattern: this._analyzeRatingPattern(userReviews),
      favoriteThemes: await this._extractThemePreferences(userReviews, favoriteBooks),
      publicationEra: this._analyzePublicationEraPreferences(userReviews, favoriteBooks)
    };
    
    return preferences;
  }
  
  /**
   * Extract genre preferences from user activity
   * 
   * @private
   * @param {Array} reviews - User reviews
   * @param {Array} favoriteBooks - User's favorite books
   * @returns {Promise<Array>} Weighted genre preferences
   */
  async _extractGenrePreferences(reviews, favoriteBooks) {
    const genreScores = {};
    
    // Process reviews
    for (const review of reviews) {
      const book = await this.bookModel.findById(review.bookId);
      if (!book || !book.genres) continue;
      
      const weight = this._calculateReviewWeight(review);
      book.genres.forEach(genre => {
        genreScores[genre] = (genreScores[genre] || 0) + weight;
      });
    }
    
    // Process favorites (higher weight)
    for (const book of favoriteBooks) {
      if (!book.genres) continue;
      
      book.genres.forEach(genre => {
        genreScores[genre] = (genreScores[genre] || 0) + 2; // Favorite books have higher weight
      });
    }
    
    // Convert to array of objects with weight
    return Object.entries(genreScores)
      .map(([genre, score]) => ({ genre, score }))
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Extract author preferences from user activity
   * 
   * @private
   * @param {Array} reviews - User reviews
   * @param {Array} favoriteBooks - User's favorite books
   * @returns {Promise<Array>} Weighted author preferences
   */
  async _extractAuthorPreferences(reviews, favoriteBooks) {
    const authorScores = {};
    
    // Process reviews
    for (const review of reviews) {
      const book = await this.bookModel.findById(review.bookId);
      if (!book || !book.author) continue;
      
      const weight = this._calculateReviewWeight(review);
      const author = book.author;
      authorScores[author] = (authorScores[author] || 0) + weight;
    }
    
    // Process favorites (higher weight)
    for (const book of favoriteBooks) {
      if (!book.author) continue;
      
      const author = book.author;
      authorScores[author] = (authorScores[author] || 0) + 2; // Favorite books have higher weight
    }
    
    // Convert to array of objects with weight
    return Object.entries(authorScores)
      .map(([author, score]) => ({ author, score }))
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Analyze user rating patterns
   * 
   * @private
   * @param {Array} reviews - User reviews
   * @returns {Object} Rating pattern analysis
   */
  _analyzeRatingPattern(reviews) {
    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 0,
        ratingDistribution: {},
        ratingBias: 'neutral',
      };
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Calculate rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = reviews.filter(r => r.rating === i).length;
    }
    
    // Determine rating bias
    let ratingBias = 'neutral';
    if (averageRating > 4) {
      ratingBias = 'positive';
    } else if (averageRating < 3) {
      ratingBias = 'negative';
    }
    
    return {
      averageRating,
      ratingDistribution,
      ratingBias
    };
  }
  
  /**
   * Extract theme preferences based on highly rated books
   * 
   * @private
   * @param {Array} reviews - User reviews
   * @param {Array} favoriteBooks - User's favorite books
   * @returns {Promise<Array>} Theme preferences
   */
  async _extractThemePreferences(reviews, favoriteBooks) {
    // This would ideally use NLP to extract themes from book descriptions
    // For now, we'll use a simplified approach based on genres and keywords
    
    // Common themes mapped to genres
    const genreThemeMap = {
      'Fantasy': ['magic', 'adventure', 'mythical creatures'],
      'Science Fiction': ['technology', 'space', 'future', 'dystopian'],
      'Mystery': ['crime', 'detective', 'suspense'],
      'Romance': ['love', 'relationships', 'emotional'],
      'Thriller': ['suspense', 'tension', 'psychological'],
      'Horror': ['fear', 'supernatural', 'suspense'],
      'Historical Fiction': ['history', 'period', 'cultural'],
      'Biography': ['life story', 'personal journey'],
      'Self-help': ['personal development', 'motivation'],
      'Business': ['entrepreneurship', 'leadership', 'strategy']
    };
    
    // Extract themes based on genres from top-rated books and favorites
    const themeScores = {};
    
    // Get high-rated reviews (4-5 stars)
    const highRatedReviews = reviews.filter(review => review.rating >= 4);
    
    // Process high-rated reviews
    for (const review of highRatedReviews) {
      const book = await this.bookModel.findById(review.bookId);
      if (!book || !book.genres) continue;
      
      book.genres.forEach(genre => {
        const themes = genreThemeMap[genre] || [];
        themes.forEach(theme => {
          themeScores[theme] = (themeScores[theme] || 0) + 1;
        });
      });
    }
    
    // Process favorites
    for (const book of favoriteBooks) {
      if (!book.genres) continue;
      
      book.genres.forEach(genre => {
        const themes = genreThemeMap[genre] || [];
        themes.forEach(theme => {
          themeScores[theme] = (themeScores[theme] || 0) + 2;
        });
      });
    }
    
    // Convert to array of objects with weight
    return Object.entries(themeScores)
      .map(([theme, score]) => ({ theme, score }))
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Analyze preferences for publication eras
   * 
   * @private
   * @param {Array} reviews - User reviews
   * @param {Array} favoriteBooks - User's favorite books
   * @returns {Object} Publication era preferences
   */
  _analyzePublicationEraPreferences(reviews, favoriteBooks) {
    // Define eras
    const eras = {
      'classic': { start: 0, end: 1950, count: 0 },
      'modern': { start: 1951, end: 2000, count: 0 },
      'contemporary': { start: 2001, end: 2100, count: 0 }
    };
    
    // Process reviews
    for (const review of reviews) {
      const book = this._findBookInArray(review.bookId, this.allBooks);
      if (!book || !book.publishedYear) continue;
      
      const year = book.publishedYear;
      this._incrementEraCount(year, eras, 1);
    }
    
    // Process favorites (higher weight)
    for (const book of favoriteBooks) {
      if (!book.publishedYear) continue;
      
      const year = book.publishedYear;
      this._incrementEraCount(year, eras, 2);
    }
    
    // Find preferred era
    let preferredEra = 'contemporary';
    let maxCount = 0;
    
    for (const [era, data] of Object.entries(eras)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        preferredEra = era;
      }
    }
    
    return {
      eras,
      preferredEra
    };
  }
  
  /**
   * Calculate weight for a review based on rating
   * 
   * @private
   * @param {Object} review - Review object
   * @returns {number} Weight value
   */
  _calculateReviewWeight(review) {
    // Higher ratings have higher weight
    switch (review.rating) {
      case 5: return 2.0;
      case 4: return 1.5;
      case 3: return 1.0;
      case 2: return 0.5;
      case 1: return 0.25;
      default: return 0;
    }
  }
  
  /**
   * Find a book in an array by ID
   * 
   * @private
   * @param {string} bookId - Book ID
   * @param {Array} books - Array of books
   * @returns {Object|null} Found book or null
   */
  _findBookInArray(bookId, books) {
    return books.find(book => book.id === bookId) || null;
  }
  
  /**
   * Increment count for the corresponding era
   * 
   * @private
   * @param {number} year - Publication year
   * @param {Object} eras - Era object with counts
   * @param {number} weight - Weight to add
   */
  _incrementEraCount(year, eras, weight) {
    for (const [era, data] of Object.entries(eras)) {
      if (year >= data.start && year <= data.end) {
        data.count += weight;
        break;
      }
    }
  }
}

module.exports = new PreferenceService();
