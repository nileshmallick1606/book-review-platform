import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Review } from '../../types';
import userService from '../../services/userService';
import reviewService from '../../services/reviewService';

interface UserReviewsProps {
  userId: string;
}

const UserReviews: React.FC<UserReviewsProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserReviews(userId, { page });
      setReviews(response.reviews);
      setTotalPages(response.totalPages);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [userId, page]);

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewService.deleteReview(reviewId);
        // Refresh the reviews list
        fetchReviews();
      } catch (err: any) {
        setError(err.message || 'Failed to delete review');
      }
    }
  };

  if (loading) return <div className="loading">Loading reviews...</div>;
  
  if (error) return <div className="error">{error}</div>;
  
  if (reviews.length === 0) {
    return <div className="no-reviews">You haven't written any reviews yet.</div>;
  }

  return (
    <div className="user-reviews">
      <h2>My Reviews</h2>
      
      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            {review.book && (
              <div className="review-book">
                <Link href={`/books/${review.bookId}`}>
                  <div className="book-preview">
                    {review.book.coverImage && (
                      <img 
                        src={review.book.coverImage} 
                        alt={review.book.title}
                        className="book-cover"
                      />
                    )}
                    <div className="book-info">
                      <h3>{review.book.title}</h3>
                      <p>{review.book.author}</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            
            <div className="review-content">
              <div className="review-rating">
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </div>
              <div className="review-text">{review.text}</div>
              <div className="review-date">
                {new Date(review.timestamp).toLocaleDateString()}
              </div>
            </div>
            
            <div className="review-actions">
              <Link href={`/books/${review.bookId}?editReview=${review.id}`}>
                <button className="edit-button">Edit</button>
              </Link>
              <button 
                className="delete-button"
                onClick={() => handleDeleteReview(review.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="page-indicator">{page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserReviews;
