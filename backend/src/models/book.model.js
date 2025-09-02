const BaseModel = require('./base.model');

class BookModel extends BaseModel {
  constructor() {
    super('books');
  }

  // Find books by title or author (search functionality)
  async search(query, options = {}) {
    const books = await this.findAll();
    const searchTerm = query.toLowerCase();
    const { genre, yearFrom, yearTo, minRating } = options;
    
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
    const validSortFields = ['title', 'author', 'publishedYear', 'averageRating', 'reviewCount'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'title';
    
    return [...books].sort((a, b) => {
      let comparison = 0;
      
      // Handle strings case-insensitively
      if (typeof a[field] === 'string') {
        comparison = a[field].toLowerCase().localeCompare(b[field].toLowerCase());
      } else {
        // Handle numbers
        comparison = a[field] - b[field];
      }
      
      // Apply sort order
      return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
    });
  }

  // Update book ratings based on actual reviews data
  async updateBookRatings(bookId) {
    const reviewModel = require('./review.model');
    const bookReviews = await reviewModel.findByBookId(bookId);
    
    // Get the book
    const book = await this.findById(bookId);
    if (!book) return false;
    
    // Calculate average rating and review count
    const reviewCount = bookReviews.length;
    const averageRating = reviewCount > 0 
      ? bookReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;
    
    // Round average rating to 1 decimal place
    const roundedRating = Math.round(averageRating * 10) / 10;
    
    // Update book with calculated values
    await this.update(bookId, {
      reviewCount,
      averageRating: roundedRating
    });
    
    return true;
  }

  // Update ratings for all books
  async updateAllBookRatings() {
    try {
      const books = await this.findAll();
      
      // Process each book
      for (const book of books) {
        await this.updateBookRatings(book.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating all book ratings:', error);
      return false;
    }
  }
}

module.exports = new BookModel();
