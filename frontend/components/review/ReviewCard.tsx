import React from 'react';
import { Review } from '../../services/reviewService';
import StarRating from '../ui/StarRating';

interface ReviewCardProps {
  review: Review;
  isOwner: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

/**
 * Component to display an individual review
 */
const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  isOwner, 
  onEdit, 
  onDelete 
}) => {
  // Format date to more readable format
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-user-info">
          <h4>{review.user?.name || 'Anonymous User'}</h4>
          <span className="review-date">{formatDate(review.timestamp)}</span>
        </div>
        <div className="review-rating">
          <StarRating rating={review.rating} readOnly />
        </div>
      </div>
      
      <div className="review-content">
        <p>{review.text}</p>
      </div>
      
      {isOwner && (
        <div className="review-actions">
          <button 
            className="btn btn-edit" 
            onClick={() => onEdit && onEdit(review)}
          >
            Edit
          </button>
          <button 
            className="btn btn-delete" 
            onClick={() => onDelete && onDelete(review.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
