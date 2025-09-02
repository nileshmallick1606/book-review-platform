import api from './api';

/**
 * Interface for Book object
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  publishedYear: number;
  averageRating: number;
  reviewCount: number;
}

/**
 * Interface for search filters
 */
export interface BookSearchFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  maxRating?: number;
  hasReviews?: boolean;
}

/**
 * Book API Service
 * Handles all book-related API calls to the backend
 */
const bookService = {
  /**
   * Get paginated list of books with optional sorting and filtering
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of books per page
   * @param {string} sortBy - Field to sort by (title, author, publishedYear, averageRating, popularity)
   * @param {string} sortOrder - Sort order (asc or desc)
   * @param {number} minRating - Minimum rating filter (1-5)
   * @returns {Promise<Object>} - Paginated books response
   */
  async getBooks(page = 1, limit = 10, sortBy = 'title', sortOrder = 'asc', minRating?: number) {
    try {
      const response = await api.get('/books', {
        params: { 
          page, 
          limit, 
          sortBy, 
          sortOrder,
          minRating
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  /**
   * Search for books by title or author with optional filters
   * @param {string} query - Search term
   * @param {BookSearchFilters} filters - Optional filters
   * @returns {Promise<Object>} - Search results
   */
  async searchBooks(query: string, filters: BookSearchFilters = {}) {
    try {
      const response = await api.get('/books/search', {
        params: { 
          q: query,
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  },

  /**
   * Get a book by its ID
   * @param {string} id - Book ID
   * @param {boolean} includeReviews - Whether to include reviews in the response
   * @returns {Promise<Object>} - Book details
   */
  async getBookById(id: string, includeReviews: boolean = false) {
    try {
      const response = await api.get(`/books/${id}`, {
        params: { includeReviews }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching book with ID ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get detailed rating information for a book
   * 
   * @param {string} id - Book ID
   * @returns {Promise<Object>} - Rating details including distribution
   */
  async getBookRatingDetails(id: string) {
    try {
      const response = await api.get(`/books/${id}/ratings`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching rating details for book ${id}:`, error);
      throw error;
    }
  }
};

export default bookService;
