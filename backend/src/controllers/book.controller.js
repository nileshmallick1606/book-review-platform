const bookModel = require('../models/book.model');

// Get all books (paginated with sorting)
const getAllBooks = async (req, res, next) => {
  try {
    // Check for invalid pagination parameters before applying defaults
    if (req.query.page && parseInt(req.query.page) < 1 || req.query.limit && parseInt(req.query.limit) < 1) {
      return res.status(400).json({ 
        message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.' 
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'title';
    const sortOrder = req.query.sortOrder || 'asc';
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : undefined;
    
    // Additional validation for limit > 100
    if (limit > 100) {
      return res.status(400).json({ 
        message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.' 
      });
    }
    
    // Use the model's getPaginated method
    const result = await bookModel.getPaginated(page, limit, sortBy, sortOrder);
    
    // Filter by minimum rating if provided
    if (minRating !== undefined) {
      result.books = result.books.filter(book => book.averageRating >= minRating);
      result.totalBooks = result.books.length;
      result.totalPages = Math.ceil(result.totalBooks / limit);
    }
    
    res.status(200).json({
      ...result,
      links: {
        self: `/api/books?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${minRating ? `&minRating=${minRating}` : ''}`,
        first: `/api/books?page=1&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${minRating ? `&minRating=${minRating}` : ''}`,
        last: `/api/books?page=${result.totalPages}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${minRating ? `&minRating=${minRating}` : ''}`,
        prev: page > 1 ? `/api/books?page=${page-1}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${minRating ? `&minRating=${minRating}` : ''}` : null,
        next: page < result.totalPages ? `/api/books?page=${page+1}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${minRating ? `&minRating=${minRating}` : ''}` : null
      },
      filters: {
        minRating: minRating || 'any'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search books by title or author with optional filters
const searchBooks = async (req, res, next) => {
  try {
    const { 
      q, 
      genre, 
      yearFrom, 
      yearTo, 
      minRating,
      maxRating,
      hasReviews
    } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Parse numeric parameters
    const filters = {
      genre,
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxRating: maxRating ? parseFloat(maxRating) : undefined,
      hasReviews: hasReviews ? hasReviews.toLowerCase() === 'true' : undefined
    };
    
    const books = await bookModel.search(q, filters);
    
    res.status(200).json({ 
      books,
      count: books.length,
      query: q,
      filters: {
        genre: filters.genre || 'all',
        yearFrom: filters.yearFrom || 'any',
        yearTo: filters.yearTo || 'any',
        minRating: filters.minRating || 'any',
        maxRating: filters.maxRating || 'any',
        hasReviews: filters.hasReviews !== undefined ? filters.hasReviews : 'any'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get book by ID with optional related data
const getBookById = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const includeReviews = req.query.includeReviews === 'true';
    
    if (!bookId || typeof bookId !== 'string') {
      return res.status(400).json({ message: 'Valid book ID is required' });
    }
    
    const book = await bookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Create the response object
    const response = { book };
    
    // Optionally include reviews if requested
    if (includeReviews) {
      const reviewModel = require('../models/review.model');
      const reviewsResult = await reviewModel.findByBookId(bookId);
      response.reviews = reviewsResult.reviews; // Extract just the array of reviews
      response.message = "Successfully retrieved book with reviews"; // Add a message property
    }
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get detailed rating information for a book
const getBookRatings = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    
    if (!bookId || typeof bookId !== 'string') {
      return res.status(400).json({ message: 'Valid book ID is required' });
    }
    
    // Get the book
    const book = await bookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Get reviews to calculate distribution
    const reviewModel = require('../models/review.model');
    const ratingUtils = require('../utils/rating.utils');
    const reviewResult = await reviewModel.findByBookId(bookId, { limit: 1000 }); // Get all reviews
    
    // Calculate rating distribution
    const distribution = ratingUtils.calculateRatingDistribution(reviewResult.reviews);
    const positivePercentage = ratingUtils.getPositiveRatingPercentage(distribution);
    
    res.status(200).json({
      bookId,
      title: book.title,
      averageRating: book.averageRating,
      reviewCount: book.reviewCount,
      distribution,
      positivePercentage
    });
  } catch (error) {
    next(error);
  }
};

// Recalculate ratings for a book
const recalculateBookRating = async (req, res, next) => {
  try {
    // Check if user has admin privileges
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bookId = req.params.id;
    
    if (!bookId || typeof bookId !== 'string') {
      return res.status(400).json({ message: 'Valid book ID is required' });
    }
    
    // Update rating
    const result = await bookModel.updateBookRatings(bookId);
    
    if (!result.success) {
      return res.status(404).json({ message: result.message || 'Error updating book rating' });
    }
    
    res.status(200).json({
      message: 'Book rating recalculated successfully',
      bookId,
      averageRating: result.averageRating,
      reviewCount: result.reviewCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  searchBooks,
  getBookById,
  getBookRatings,
  recalculateBookRating
};
