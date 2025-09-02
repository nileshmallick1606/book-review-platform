const bookModel = require('../models/book.model');

// Get all books (paginated)
const getAllBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await bookModel.getPaginated(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Search books by title or author
const searchBooks = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const books = await bookModel.search(query);
    
    res.status(200).json({ books });
  } catch (error) {
    next(error);
  }
};

// Get book by ID
const getBookById = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    
    const book = await bookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.status(200).json({ book });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  searchBooks,
  getBookById
};
