const bookModel = require('../models/book.model');

// Get all books (paginated with sorting)
const getAllBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'title';
    const sortOrder = req.query.sortOrder || 'asc';
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ 
        message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.' 
      });
    }
    
    const result = await bookModel.getPaginated(page, limit, sortBy, sortOrder);
    
    res.status(200).json({
      ...result,
      links: {
        self: `/api/books?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        first: `/api/books?page=1&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        last: `/api/books?page=${result.totalPages}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        prev: page > 1 ? `/api/books?page=${page-1}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}` : null,
        next: page < result.totalPages ? `/api/books?page=${page+1}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}` : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search books by title or author with optional filters
const searchBooks = async (req, res, next) => {
  try {
    const { q, genre, yearFrom, yearTo, minRating } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Parse numeric parameters
    const filters = {
      genre,
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined
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
        minRating: filters.minRating || 'any'
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
      response.reviews = await reviewModel.findByBookId(bookId);
    }
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  searchBooks,
  getBookById
};
