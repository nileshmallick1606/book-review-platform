const BaseModel = require('./base.model');

class ReviewModel extends BaseModel {
  constructor() {
    super('reviews');
  }

  // Find reviews by book ID
  async findByBookId(bookId) {
    const reviews = await this.findAll();
    return reviews.filter(review => review.bookId === bookId);
  }

  // Find reviews by user ID
  async findByUserId(userId) {
    const reviews = await this.findAll();
    return reviews.filter(review => review.userId === userId);
  }

  // Create a review with timestamp
  async create(data) {
    return super.create({
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Check if user has already reviewed a book
  async userHasReviewed(userId, bookId) {
    const reviews = await this.findAll();
    return reviews.some(review => 
      review.userId === userId && review.bookId === bookId
    );
  }
}

module.exports = new ReviewModel();
