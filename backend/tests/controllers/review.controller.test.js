const { getBookReviews, createReview, updateReview, deleteReview } = require('../../src/controllers/review.controller');
const reviewModel = require('../../src/models/review.model');
const bookModel = require('../../src/models/book.model');

// Mock the required models
jest.mock('../../src/models/review.model');
jest.mock('../../src/models/book.model');

describe('Review Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getBookReviews', () => {
    it('should get reviews for a book with pagination and sorting', async () => {
      // Setup
      req.params.bookId = 'book123';
      req.query = { page: '2', limit: '5', sortBy: 'rating', sortOrder: 'desc' };

      const mockReviews = {
        reviews: [{ id: 'review1', text: 'Great book', rating: 5 }],
        totalReviews: 15,
        page: 2,
        limit: 5,
        totalPages: 3
      };

      reviewModel.findByBookIdWithUserInfo.mockResolvedValue(mockReviews);

      // Execute
      await getBookReviews(req, res, next);

      // Assert
      expect(reviewModel.findByBookIdWithUserInfo).toHaveBeenCalledWith(
        'book123',
        { page: 2, limit: 5, sortBy: 'rating', sortOrder: 'desc' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockReviews);
    });

    it('should handle errors', async () => {
      // Setup
      req.params.bookId = 'book123';
      const error = new Error('Database error');
      reviewModel.findByBookIdWithUserInfo.mockRejectedValue(error);

      // Execute
      await getBookReviews(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      // Setup
      req.params.bookId = 'book123';
      req.body = { text: 'Great book', rating: 5 };
      
      bookModel.findById.mockResolvedValue({ id: 'book123', title: 'Test Book' });
      reviewModel.userHasReviewed.mockResolvedValue(false);
      
      const mockReview = {
        id: 'review1',
        bookId: 'book123',
        userId: 'user123',
        text: 'Great book',
        rating: 5,
        timestamp: '2023-01-01T00:00:00.000Z'
      };
      
      reviewModel.create.mockResolvedValue(mockReview);
      bookModel.updateBookRatings.mockResolvedValue(true);

      // Execute
      await createReview(req, res, next);

      // Assert
      expect(reviewModel.create).toHaveBeenCalledWith({
        bookId: 'book123',
        userId: 'user123',
        text: 'Great book',
        rating: 5
      });
      expect(bookModel.updateBookRatings).toHaveBeenCalledWith('book123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review created successfully',
        review: mockReview
      });
    });

    it('should validate rating is between 1-5', async () => {
      // Setup
      req.params.bookId = 'book123';
      req.body = { text: 'Bad rating', rating: 6 };

      // Execute
      await createReview(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rating must be between 1 and 5'
      });
    });

    it('should prevent duplicate reviews from same user', async () => {
      // Setup
      req.params.bookId = 'book123';
      req.body = { text: 'Great book', rating: 5 };
      
      bookModel.findById.mockResolvedValue({ id: 'book123', title: 'Test Book' });
      reviewModel.userHasReviewed.mockResolvedValue(true);

      // Execute
      await createReview(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already reviewed this book'
      });
    });
  });

  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      // Setup
      req.params.id = 'review1';
      req.body = { text: 'Updated review', rating: 4 };
      
      const mockReview = {
        id: 'review1',
        bookId: 'book123',
        userId: 'user123',
        text: 'Old review',
        rating: 5
      };
      
      const updatedReview = {
        ...mockReview,
        text: 'Updated review',
        rating: 4
      };
      
      reviewModel.findById.mockResolvedValue(mockReview);
      reviewModel.update.mockResolvedValue(updatedReview);
      bookModel.updateBookRatings.mockResolvedValue(true);

      // Execute
      await updateReview(req, res, next);

      // Assert
      expect(reviewModel.update).toHaveBeenCalledWith('review1', {
        text: 'Updated review',
        rating: 4
      });
      expect(bookModel.updateBookRatings).toHaveBeenCalledWith('book123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review updated successfully',
        review: updatedReview
      });
    });

    it('should verify user ownership of the review', async () => {
      // Setup
      req.params.id = 'review1';
      req.body = { text: 'Updated review', rating: 4 };
      req.user.id = 'differentUser';
      
      const mockReview = {
        id: 'review1',
        bookId: 'book123',
        userId: 'user123', // Different from req.user.id
        text: 'Old review',
        rating: 5
      };
      
      reviewModel.findById.mockResolvedValue(mockReview);

      // Execute
      await updateReview(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You can only update your own reviews'
      });
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      // Setup
      req.params.id = 'review1';
      
      const mockReview = {
        id: 'review1',
        bookId: 'book123',
        userId: 'user123',
        text: 'Old review',
        rating: 5
      };
      
      reviewModel.findById.mockResolvedValue(mockReview);
      reviewModel.delete.mockResolvedValue(true);
      bookModel.updateBookRatings.mockResolvedValue(true);

      // Execute
      await deleteReview(req, res, next);

      // Assert
      expect(reviewModel.delete).toHaveBeenCalledWith('review1');
      expect(bookModel.updateBookRatings).toHaveBeenCalledWith('book123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review deleted successfully'
      });
    });

    it('should verify user ownership of the review', async () => {
      // Setup
      req.params.id = 'review1';
      req.user.id = 'differentUser';
      
      const mockReview = {
        id: 'review1',
        bookId: 'book123',
        userId: 'user123', // Different from req.user.id
        text: 'Review to delete',
        rating: 5
      };
      
      reviewModel.findById.mockResolvedValue(mockReview);

      // Execute
      await deleteReview(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You can only delete your own reviews'
      });
    });
  });
});
