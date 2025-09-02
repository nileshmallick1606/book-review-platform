const BaseModel = require('./base.model');

class BookModel extends BaseModel {
  constructor() {
    super('books');
  }

  // Find books by title or author (search functionality)
  async search(query, options = {}) {
    const books = await this.findAll();
    const searchTerm = query.toLowerCase();
    const { 
      genre, 
      yearFrom, 
      yearTo, 
      minRating, 
      maxRating, 
      hasReviews 
    } = options;
    
    return books.filter(book => {
      // Basic title/author search
      const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                           book.author.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      // Apply additional filters if provided
      if (genre && !book.genres.includes(genre)) return false;
      if (yearFrom && book.publishedYear < yearFrom) return false;
      if (yearTo && book.publishedYear > yearTo) return false;
      if (minRating && book.averageRating < minRating) return false;
      if (maxRating && book.averageRating > maxRating) return false;
      if (hasReviews === true && book.reviewCount === 0) return false;
      if (hasReviews === false && book.reviewCount > 0) return false;
      
      return true;
    });
  }

  // Find books by genre
  async findByGenre(genre) {
    const books = await this.findAll();
    return books.filter(book => book.genres.includes(genre));
  }

  // Get paginated books with optional sorting
  async getPaginated(page = 1, limit = 10, sortBy = 'title', sortOrder = 'asc') {
    let books = await this.findAll();
    
    // Apply sorting
    books = this.sortBooks(books, sortBy, sortOrder);
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
      books: books.slice(startIndex, endIndex),
      totalBooks: books.length,
      page,
      limit,
      totalPages: Math.ceil(books.length / limit),
      sortBy,
      sortOrder
    };
  }
  
  // Sort books by the given field and order
  sortBooks(books, sortBy = 'title', sortOrder = 'asc') {
    // Validate sortBy parameter to prevent errors
    const validSortFields = ['title', 'author', 'publishedYear', 'averageRating', 'reviewCount', 'popularity'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'title';
    
    return [...books].sort((a, b) => {
      let comparison = 0;
      
      // Special case for popularity (combination of rating and review count)
      if (field === 'popularity') {
        // Calculate popularity score: average rating * ln(1 + reviewCount)
        // This gives weight to both rating and number of reviews
        const scoreA = a.averageRating * Math.log(1 + a.reviewCount);
        const scoreB = b.averageRating * Math.log(1 + b.reviewCount);
        comparison = scoreA - scoreB;
      }
      // Handle strings case-insensitively
      else if (typeof a[field] === 'string') {
        comparison = a[field].toLowerCase().localeCompare(b[field].toLowerCase());
      } 
      // Special handling for averageRating to account for books with no reviews
      else if (field === 'averageRating') {
        // Books with reviews should rank higher than books with no reviews
        if (a.reviewCount === 0 && b.reviewCount > 0) {
          comparison = -1;
        } else if (a.reviewCount > 0 && b.reviewCount === 0) {
          comparison = 1;
        } else {
          comparison = a[field] - b[field];
        }
      }
      else {
        // Handle numbers
        comparison = a[field] - b[field];
      }
      
      // Apply sort order
      return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
    });
  }

  // Update book ratings based on actual reviews data
  async updateBookRatings(bookId) {
    try {
      const reviewModel = require('./review.model');
      const ratingService = require('../services/rating.service');
      
      // Get the book
      const book = await this.findById(bookId);
      if (!book) {
        console.error(`Book not found with ID: ${bookId}`);
        return { success: false, message: 'Book not found' };
      }
      
      // Get reviews for this book
      const reviewResult = await reviewModel.findByBookId(bookId);
      const bookReviews = reviewResult.reviews || [];
      
      // Calculate ratings using the specialized service
      const { averageRating, reviewCount } = ratingService.calculateAverageRating(bookReviews);
      
      // Update book with calculated values
      await this.update(bookId, {
        reviewCount,
        averageRating
      });
      
      return { 
        success: true, 
        reviewCount, 
        averageRating,
        bookId
      };
    } catch (error) {
      console.error(`Error updating ratings for book ${bookId}:`, error);
      return { 
        success: false, 
        message: error.message || 'Error updating book ratings'
      };
    }
  }

  // Update ratings for all books
  async updateAllBookRatings() {
    try {
      const books = await this.findAll();
      const results = {
        success: true,
        processed: 0,
        failed: 0,
        books: []
      };
      
      // Process each book
      for (const book of books) {
        const result = await this.updateBookRatings(book.id);
        
        if (result.success) {
          results.processed++;
          results.books.push({
            id: book.id,
            title: book.title,
            success: true,
            averageRating: result.averageRating,
            reviewCount: result.reviewCount
          });
        } else {
          results.failed++;
          results.books.push({
            id: book.id,
            title: book.title,
            success: false,
            error: result.message
          });
        }
      }
      
      // Set overall success based on if any books failed
      if (results.failed > 0) {
        results.success = false;
      }
      
      return results;
    } catch (error) {
      console.error('Error updating all book ratings:', error);
      return {
        success: false,
        message: error.message || 'Error updating all book ratings',
        processed: 0,
        failed: 0,
        books: []
      };
    }
  }
}

module.exports = new BookModel();
