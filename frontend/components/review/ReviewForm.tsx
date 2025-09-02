import React, { useState, useEffect } from 'react';
import { Review } from '../../services/reviewService';
import StarRating from '../ui/StarRating';

interface ReviewFormProps {
  bookId: string;
  review?: Review; // For editing an existing review
  onSubmit: (reviewData: { bookId: string; text: string; rating: number }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

/**
 * Component for creating or editing a review
 */
const ReviewForm: React.FC<ReviewFormProps> = ({
  bookId,
  review,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState({ text: '', rating: '' });
  const isEditing = !!review;

  // Load review data if editing
  useEffect(() => {
    if (review) {
      setText(review.text);
      setRating(review.rating);
    }
  }, [review]);

  const validate = (): boolean => {
    const newErrors = {
      text: text.trim() ? '' : 'Review text is required',
      rating: rating > 0 ? '' : 'Please select a rating'
    };
    
    setErrors(newErrors);
    return !newErrors.text && !newErrors.rating;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      await onSubmit({
        bookId,
        text,
        rating
      });
      
      // Clear form if not editing
      if (!isEditing) {
        setText('');
        setRating(0);
      }
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>{isEditing ? 'Edit Your Review' : 'Write a Review'}</h3>
      
      <div className="form-group">
        <label htmlFor="rating">Rating:</label>
        <div className="rating-selector">
          <StarRating 
            rating={rating}
            onChange={setRating}
            readOnly={false}
          />
          {errors.rating && <div className="error-message">{errors.rating}</div>}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="review-text">Your Review:</label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Share your thoughts about this book..."
          disabled={isSubmitting}
        />
        {errors.text && <div className="error-message">{errors.text}</div>}
      </div>
      
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
