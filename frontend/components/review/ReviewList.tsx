import React, { useState, useEffect } from 'react';
import { Review, PaginatedReviews } from '../../services/reviewService';
import ReviewCard from './ReviewCard';

interface ReviewListProps {
  bookId: string;
  reviews: Review[];
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  userId?: string; // Current user ID to check if they own the review
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onEditReview: (review: Review) => void;
  onDeleteReview: (reviewId: string) => void;
  loading: boolean;
}

/**
 * Component to display a list of reviews with pagination
 */
const ReviewList: React.FC<ReviewListProps> = ({
  bookId,
  reviews,
  totalReviews,
  currentPage,
  totalPages,
  userId,
  onPageChange,
  onSortChange,
  onEditReview,
  onDeleteReview,
  loading
}) => {
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    let newSortBy = 'timestamp';
    let newSortOrder = 'desc';

    switch (value) {
      case 'newest':
        newSortBy = 'timestamp';
        newSortOrder = 'desc';
        break;
      case 'oldest':
        newSortBy = 'timestamp';
        newSortOrder = 'asc';
        break;
      case 'highest':
        newSortBy = 'rating';
        newSortOrder = 'desc';
        break;
      case 'lowest':
        newSortBy = 'rating';
        newSortOrder = 'asc';
        break;
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    onSortChange(newSortBy, newSortOrder);
  };

  // Create array of page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="review-list">
      <div className="review-header">
        <h3>Reviews ({totalReviews})</h3>
        <div className="review-sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            onChange={handleSortChange}
            value={sortBy === 'timestamp' ? (sortOrder === 'desc' ? 'newest' : 'oldest') : (sortOrder === 'desc' ? 'highest' : 'lowest')}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="reviews">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwner={userId === review.userId}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
