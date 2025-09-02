import api from './api';

/**
 * Interface for Review object
 */
export interface Review {
  id: string;
  bookId: string;
  userId: string;
  text: string;
  rating: number;
  timestamp: string;
  user?: {
    id: string;
    name: string;
  };
}

/**
 * Interface for paginated review response
 */
export interface PaginatedReviews {
  reviews: Review[];
  totalReviews: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Review API Service
 * Handles all review-related API calls to the backend
 */
const reviewService = {
  /**
   * Get reviews for a book with optional pagination and sorting
   * @param {string} bookId - Book ID to get reviews for
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of reviews per page
   * @param {string} sortBy - Field to sort by (timestamp, rating)
   * @param {string} sortOrder - Sort order (asc or desc)
   * @returns {Promise<PaginatedReviews>} - Paginated reviews response
   */
  async getBookReviews(bookId: string, page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc'): Promise<PaginatedReviews> {
    try {
      const response = await api.get(`/books/${bookId}/reviews`, {
        params: { page, limit, sortBy, sortOrder }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching book reviews:', error);
      throw error;
    }
  },

  /**
   * Create a new review for a book
   * @param {string} bookId - Book ID to review
   * @param {object} reviewData - Review data (text, rating)
   * @returns {Promise<Object>} - Created review
   */
  async createReview(bookId: string, reviewData: { text: string; rating: number }): Promise<{ review: Review; message: string }> {
    try {
      const response = await api.post(`/books/${bookId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  /**
   * Update an existing review
   * @param {string} reviewId - Review ID to update
   * @param {object} reviewData - Updated review data (text, rating)
   * @returns {Promise<Object>} - Updated review
   */
  async updateReview(reviewId: string, reviewData: { text: string; rating: number }): Promise<{ review: Review; message: string }> {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  /**
   * Delete a review
   * @param {string} reviewId - Review ID to delete
   * @returns {Promise<Object>} - Success message
   */
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  /**
   * Get reviews by a specific user
   * @param {string} userId - User ID to get reviews for
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of reviews per page
   * @returns {Promise<PaginatedReviews>} - User's reviews
   */
  async getUserReviews(userId: string, page = 1, limit = 10): Promise<PaginatedReviews> {
    try {
      const response = await api.get(`/users/${userId}/reviews`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }
};

export default reviewService;
