import React, { useState } from 'react';
import RecommendationCard from './RecommendationCard';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  reason: string;
  genres?: string[];
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
  showFilters?: boolean;
}

/**
 * Component to display a list of book recommendations
 */
const RecommendationList: React.FC<RecommendationListProps> = ({ 
  recommendations, 
  isLoading, 
  error,
  onRefresh,
  showFilters = false
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  // Extract unique genres from all recommendations
  const allGenres = Array.from(
    new Set(
      recommendations
        .flatMap(rec => rec.genres || [])
        .filter(genre => genre)
    )
  );
  
  // Filter recommendations by genre if selected
  const filteredRecommendations = selectedGenre 
    ? recommendations.filter(rec => 
        rec.genres?.some(genre => genre.toLowerCase() === selectedGenre.toLowerCase())
      )
    : recommendations;
  
  // Handler for genre filter change
  const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(event.target.value);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSelectedGenre('');
  };
  
  return (
    <div className="recommendation-list">
      {/* Loading and error states */}
      {isLoading && (
        <div className="recommendation-list__loading">
          <p>Loading recommendations...</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {error && (
        <div className="recommendation-list__error">
          <p>Error loading recommendations: {error}</p>
          {onRefresh && (
            <button onClick={onRefresh} className="btn btn-secondary">
              Try Again
            </button>
          )}
        </div>
      )}
      
      {/* Filters */}
      {showFilters && !isLoading && !error && recommendations.length > 0 && (
        <div className="recommendation-list__filters">
          <div className="filter-group">
            <label htmlFor="genre-filter">Filter by genre:</label>
            <select 
              id="genre-filter" 
              value={selectedGenre} 
              onChange={handleGenreChange}
              className="select-filter"
            >
              <option value="">All Genres</option>
              {allGenres.map((genre, index) => (
                <option key={index} value={genre}>{genre}</option>
              ))}
            </select>
            
            {selectedGenre && (
              <button 
                onClick={handleResetFilters} 
                className="btn btn-text"
              >
                Clear Filter
              </button>
            )}
          </div>
          
          {onRefresh && (
            <button onClick={onRefresh} className="btn btn-outline">
              <i className="icon-refresh"></i> Refresh Recommendations
            </button>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && filteredRecommendations.length === 0 && (
        <div className="recommendation-list__empty">
          <p>No recommendations available{selectedGenre ? ` for "${selectedGenre}" genre` : ''}.</p>
          {selectedGenre && (
            <button 
              onClick={handleResetFilters} 
              className="btn btn-secondary"
            >
              Clear Filter
            </button>
          )}
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="btn btn-primary"
            >
              Get Recommendations
            </button>
          )}
        </div>
      )}
      
      {/* Recommendations */}
      {!isLoading && !error && filteredRecommendations.length > 0 && (
        <>
          {selectedGenre && (
            <p className="recommendation-list__filter-info">
              Showing recommendations for "{selectedGenre}" genre
            </p>
          )}
          
          <div className="recommendation-list__grid">
            {filteredRecommendations.map(recommendation => (
              <RecommendationCard 
                key={recommendation.id} 
                recommendation={recommendation} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RecommendationList;
