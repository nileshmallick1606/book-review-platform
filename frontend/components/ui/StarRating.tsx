import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  precision?: 'full' | 'half' | 'quarter';
}

/**
 * Enhanced Star rating component that can handle decimal ratings
 * and displays half/quarter stars for more precise visual representation
 */
const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  onChange, 
  readOnly = false,
  showText = false,
  size = 'medium',
  precision = 'half'
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  // Create an array from 1 to maxRating
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);
  
  // Map size to CSS class
  const sizeClass = {
    small: 'star-small',
    medium: 'star-medium',
    large: 'star-large'
  }[size];
  
  const handleClick = (value: number) => {
    if (!readOnly && onChange) {
      onChange(value);
    }
  };
  
  // Determine what star icon to show based on the rating value and position
  const getStarIcon = (position: number, currentRating: number) => {
    const difference = currentRating - position + 1;
    
    // Full star
    if (difference >= 1) {
      return '★';
    }
    
    // Different partial stars based on precision
    if (precision === 'half' && difference >= 0.5) {
      return '½'; // Using half-star Unicode or could use a custom icon
    }
    
    if (precision === 'quarter') {
      if (difference >= 0.75) {
        return '¾'; // Using fraction Unicode or could use a custom icon
      }
      if (difference >= 0.5) {
        return '½';
      }
      if (difference >= 0.25) {
        return '¼';
      }
    }
    
    // Empty star
    return '☆';
  };
  
  return (
    <div className={`star-rating ${sizeClass}`} role="img" aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
      {stars.map((position) => (
        <span
          key={position}
          className={`star ${
            position <= Math.ceil(hoverRating || rating) ? 'filled' : 'empty'
          } ${position > Math.floor(hoverRating || rating) && 
              position <= Math.ceil(hoverRating || rating) ? 'partial' : ''}`}
          onClick={() => handleClick(position)}
          onMouseEnter={() => !readOnly && setHoverRating(position)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
          title={`${position} ${position === 1 ? 'star' : 'stars'}`}
          data-testid={`star-${position}`}
        >
          {/* Show appropriate star based on rating */}
          {getStarIcon(position, hoverRating || rating)}
        </span>
      ))}
      {(showText || !readOnly) && (
        <span className="rating-number" aria-hidden="true" data-testid="rating-text">{(hoverRating || rating || 0).toFixed(1)}/{maxRating}</span>
      )}
    </div>
  );
};

export default StarRating;
