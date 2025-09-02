import React from 'react';
import StarRating from './StarRating';

interface RatingSummaryProps {
  averageRating: number;
  reviewCount: number;
  showCount?: boolean;
  showAverage?: boolean;
  size?: 'small' | 'medium' | 'large';
  distribution?: {
    [key: string]: number;
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

/**
 * RatingSummary component displays an overview of book ratings
 * Can optionally show distribution of ratings in a bar chart
 */
const RatingSummary: React.FC<RatingSummaryProps> = ({ 
  averageRating, 
  reviewCount,
  showCount = true,
  showAverage = true,
  size = 'medium',
  distribution
}) => {
  // Calculate max count for distribution visualization
  const maxCount = distribution 
    ? Math.max(...Object.values(distribution))
    : 0;

  return (
    <div className="rating-summary">
      <div className="rating-header">
        <div className="rating-stars">
          <StarRating 
            rating={averageRating} 
            readOnly={true} 
            size={size}
            precision="half"
          />
        </div>
        
        <div className="rating-meta">
          {showAverage && (
            <span className="rating-average" aria-label={`Average rating: ${averageRating.toFixed(1)} out of 5 stars`}>
              {averageRating.toFixed(1)}
            </span>
          )}
          
          {showCount && (
            <span className="rating-count">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
      </div>
      
      {distribution && maxCount > 0 && (
        <div className="rating-distribution" aria-label="Rating distribution">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="distribution-row">
              <span className="star-label">{star}</span>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ width: `${(distribution[star.toString()] / maxCount) * 100}%` }}
                  aria-label={`${star} stars: ${distribution[star.toString()]} reviews`}
                ></div>
              </div>
              <span className="count">{distribution[star.toString()]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingSummary;
