const BaseModel = require('./base.model');

class BookModel extends BaseModel {
  constructor() {
    super('books');
  }

  // Find books by title or author (search functionality)
  async search(query) {
    const books = await this.findAll();
    const searchTerm = query.toLowerCase();
    
    return books.filter(book => 
      book.title.toLowerCase().includes(searchTerm) || 
      book.author.toLowerCase().includes(searchTerm)
    );
  }

  // Find books by genre
  async findByGenre(genre) {
    const books = await this.findAll();
    return books.filter(book => book.genres.includes(genre));
  }

  // Get paginated books
  async getPaginated(page = 1, limit = 10) {
    const books = await this.findAll();
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
      books: books.slice(startIndex, endIndex),
      totalBooks: books.length,
      page,
      limit,
      totalPages: Math.ceil(books.length / limit)
    };
  }

  // Update book ratings
  async updateBookRatings(bookId) {
    // This would be implemented in a real system to recalculate
    // average rating and review count when reviews change
    return true;
  }
}

module.exports = new BookModel();
