import React from 'react';
import StarRating from './StarRating';

interface RatingFilterProps {
  minRating: number;
  onChange: (rating: number) => void;
}

/**
 * Component for filtering books by minimum rating
 */
const RatingFilter: React.FC<RatingFilterProps> = ({ minRating, onChange }) => {
  return (
    <div className="rating-filter">
      <div className="filter-label">Minimum Rating:</div>
      <div className="filter-control">
        <StarRating
          rating={minRating}
          onChange={onChange}
          readOnly={false}
          size="small"
        />
        <button 
          className="clear-filter-btn"
          onClick={() => onChange(0)}
          aria-label="Clear rating filter"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default RatingFilter;
