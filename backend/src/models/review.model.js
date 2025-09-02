const BaseModel = require('./base.model');
const userModel = require('./user.model');

class ReviewModel extends BaseModel {
  constructor() {
    super('reviews');
  }

  // Find reviews by book ID with optional pagination and sorting
  async findByBookId(bookId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = options;
    let reviews = await this.findAll();
    
    // Filter by book ID
    reviews = reviews.filter(review => review.bookId === bookId);
    
    // Apply sorting
    reviews = this.sortReviews(reviews, sortBy, sortOrder);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
      reviews: reviews.slice(startIndex, endIndex),
      totalReviews: reviews.length,
      page,
      limit,
      totalPages: Math.ceil(reviews.length / limit)
    };
  }

  // Find reviews by book ID with user information
  async findByBookIdWithUserInfo(bookId, options = {}) {
    const result = await this.findByBookId(bookId, options);
    
    // Fetch user information for each review
    const reviewsWithUserInfo = await Promise.all(
      result.reviews.map(async review => {
        const user = await userModel.findById(review.userId);
        return {
          ...review,
          user: user ? { id: user.id, name: user.name } : null
        };
      })
    );
    
    return {
      ...result,
      reviews: reviewsWithUserInfo
    };
  }

  // Find reviews by user ID with optional pagination
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = options;
    let reviews = await this.findAll();
    
    // Filter by user ID
    reviews = reviews.filter(review => review.userId === userId);
    
    // Apply sorting
    reviews = this.sortReviews(reviews, sortBy, sortOrder);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
      reviews: reviews.slice(startIndex, endIndex),
      totalReviews: reviews.length,
      page,
      limit,
      totalPages: Math.ceil(reviews.length / limit)
    };
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

  // Helper method to sort reviews
  sortReviews(reviews, sortBy = 'timestamp', sortOrder = 'desc') {
    const validSortFields = ['timestamp', 'rating'];
    
    // Default to timestamp if sortBy is not valid
    const field = validSortFields.includes(sortBy) ? sortBy : 'timestamp';
    
    return [...reviews].sort((a, b) => {
      // For dates, convert to Date objects for comparison
      if (field === 'timestamp') {
        const dateA = new Date(a[field]);
        const dateB = new Date(b[field]);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // For numeric fields
      return sortOrder === 'asc' ? a[field] - b[field] : b[field] - a[field];
    });
  }
}

module.exports = new ReviewModel();
