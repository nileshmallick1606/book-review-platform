import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}

/**
 * Star rating component that can be used both for display and selection
 */
const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  onChange, 
  readOnly = false 
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  // Create an array from 1 to maxRating
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);
  
  const handleClick = (value: number) => {
    if (!readOnly && onChange) {
      onChange(value);
    }
  };
  
  return (
    <div className="star-rating">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${
            star <= (hoverRating || rating) ? 'filled' : 'empty'
          }`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
          {/* Using Unicode star character */}
          {star <= (hoverRating || rating) ? '★' : '☆'}
        </span>
      ))}
      {!readOnly && (
        <span className="rating-number">{hoverRating || rating || 0}/{maxRating}</span>
      )}
    </div>
  );
};

export default StarRating;
