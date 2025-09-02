const fs = require('fs').promises;
const reviewModel = require('../../src/models/review.model');
const userModel = require('../../src/models/user.model');
const { getDataFilePath } = require('../../src/config/db');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

jest.mock('../../src/models/user.model');
jest.mock('../../src/config/db', () => ({
  getDataFilePath: jest.fn()
}));

describe('Review Model', () => {
  const mockReviews = [
    {
      id: 'review1',
      bookId: 'book1',
      userId: 'user1',
      text: 'Great book',
      rating: 5,
      timestamp: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'review2',
      bookId: 'book1',
      userId: 'user2',
      text: 'Good book',
      rating: 4,
      timestamp: '2023-01-02T00:00:00.000Z'
    },
    {
      id: 'review3',
      bookId: 'book2',
      userId: 'user1',
      text: 'Average book',
      rating: 3,
      timestamp: '2023-01-03T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    fs.readFile.mockResolvedValue(JSON.stringify(mockReviews));
    fs.writeFile.mockResolvedValue();
    getDataFilePath.mockReturnValue('path/to/reviews.json');
  });

  describe('findByBookId', () => {
    it('should return reviews for a specific book with default pagination and sorting', async () => {
      // Execute
      const result = await reviewModel.findByBookId('book1');

      // Assert
      expect(result.reviews.length).toBe(2);
      expect(result.reviews[0].id).toBe('review2'); // Sorted by timestamp desc
      expect(result.reviews[1].id).toBe('review1');
      expect(result.totalReviews).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should apply pagination correctly', async () => {
      // Generate lots of mock reviews for book1
      const manyReviews = Array.from({ length: 25 }, (_, i) => ({
        id: `review${i + 1}`,
        bookId: 'book1',
        userId: `user${i % 5 + 1}`,
        text: `Review ${i + 1}`,
        rating: (i % 5) + 1,
        timestamp: new Date(2023, 0, i + 1).toISOString()
      }));
      
      fs.readFile.mockResolvedValue(JSON.stringify(manyReviews));

      // Execute with page 2, limit 10
      const result = await reviewModel.findByBookId('book1', { page: 2, limit: 10 });

      // Assert
      expect(result.reviews.length).toBe(10);
      expect(result.totalReviews).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should sort reviews by rating', async () => {
      // Execute with rating sorting
      const result = await reviewModel.findByBookId('book1', { 
        sortBy: 'rating', 
        sortOrder: 'desc' 
      });

      // Assert
      expect(result.reviews.length).toBe(2);
      expect(result.reviews[0].rating).toBe(5); // Highest rating first
      expect(result.reviews[1].rating).toBe(4);
    });
  });

  describe('findByBookIdWithUserInfo', () => {
    it('should return reviews with user information', async () => {
      // Setup mock user data
      userModel.findById.mockImplementation((id) => {
        if (id === 'user1') {
          return Promise.resolve({ id: 'user1', name: 'John Doe' });
        } else if (id === 'user2') {
          return Promise.resolve({ id: 'user2', name: 'Jane Smith' });
        }
        return Promise.resolve(null);
      });

      // Execute
      const result = await reviewModel.findByBookIdWithUserInfo('book1');

      // Assert
      expect(result.reviews.length).toBe(2);
      expect(result.reviews[0].user).toEqual({ id: 'user2', name: 'Jane Smith' });
      expect(result.reviews[1].user).toEqual({ id: 'user1', name: 'John Doe' });
    });
  });

  describe('userHasReviewed', () => {
    it('should return true if user has already reviewed the book', async () => {
      // Execute
      const result = await reviewModel.userHasReviewed('user1', 'book1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user has not reviewed the book', async () => {
      // Execute
      const result = await reviewModel.userHasReviewed('user3', 'book1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a new review with timestamp', async () => {
      // Setup
      const newReview = {
        bookId: 'book3',
        userId: 'user3',
        text: 'New review',
        rating: 4
      };
      
      const date = new Date('2023-01-10T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => date);

      // Execute
      await reviewModel.create(newReview);

      // Assert
      expect(fs.writeFile).toHaveBeenCalled();
      const writeFileCall = fs.writeFile.mock.calls[0];
      const writtenContent = JSON.parse(writeFileCall[1]);
      
      expect(writtenContent.length).toBe(mockReviews.length + 1);
      const createdReview = writtenContent.find(r => r.bookId === 'book3' && r.userId === 'user3');
      expect(createdReview).toBeTruthy();
      expect(createdReview.timestamp).toBe('2023-01-10T12:00:00.000Z');
      
      // Restore Date
      jest.spyOn(global, 'Date').mockRestore();
    });
  });

  describe('sortReviews', () => {
    it('should sort reviews by timestamp in descending order by default', () => {
      // Execute
      const sorted = reviewModel.sortReviews(mockReviews);

      // Assert
      expect(sorted[0].id).toBe('review3');
      expect(sorted[1].id).toBe('review2');
      expect(sorted[2].id).toBe('review1');
    });

    it('should sort reviews by rating', () => {
      // Execute
      const sorted = reviewModel.sortReviews(mockReviews, 'rating', 'desc');

      // Assert
      expect(sorted[0].rating).toBe(5);
      expect(sorted[1].rating).toBe(4);
      expect(sorted[2].rating).toBe(3);
    });

    it('should handle invalid sortBy and default to timestamp', () => {
      // Execute
      const sorted = reviewModel.sortReviews(mockReviews, 'invalid_field');

      // Assert - should still sort by timestamp
      expect(sorted[0].id).toBe('review3');
      expect(sorted[1].id).toBe('review2');
      expect(sorted[2].id).toBe('review1');
    });
  });
});
