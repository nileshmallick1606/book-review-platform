import React, { useState, useCallback } from 'react';
import { BookSearchFilters } from '../../services/bookService';

// Props interface for SearchBar
interface SearchBarProps {
  onSearch: (query: string, filters: BookSearchFilters) => void;
  initialQuery?: string;
  initialFilters?: BookSearchFilters;
  isLoading?: boolean;
}

/**
 * SearchBar component for searching books
 * Searches only when submit button is clicked or Enter key is pressed
 */
const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  initialQuery = '',
  initialFilters = {},
  isLoading = false
}) => {
  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<BookSearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Execute search
  const executeSearch = useCallback(() => {
    // Always call onSearch, even with empty query
    // This will allow the parent component to handle empty searches
    onSearch(query, filters);
  }, [query, filters, onSearch]);
  
  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };
  
  // Handle key press - search on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };
  
  // Handle input change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Clear search input only (doesn't submit)
  const handleClearInput = () => {
    setQuery('');
  };
  
  // Clear search completely and reload results
  const handleClearSearch = () => {
    setQuery('');
    setFilters({});
    // Pass empty strings to properly reset the search state in parent component
    onSearch('', {});
  };
  
  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search books by title or author..."
            value={query}
            onChange={handleQueryChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          
          {query && (
            <button 
              type="button"
              className="search-clear-button"
              onClick={handleClearInput}
              disabled={isLoading}
              aria-label="Clear search input"
            >
              &times;
            </button>
          )}
          
          <button
            type="submit"
            className="search-submit-button"
            disabled={isLoading}
          >
            Search
          </button>
          
          <button
            type="button"
            className="search-reset-button"
            onClick={handleClearSearch}
            disabled={isLoading}
            aria-label="Clear search and reload"
          >
            Reset
          </button>
          
          <button 
            type="button"
            className={`search-filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoading}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <span>Filter</span>
            <span className="filter-icon">{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>
      </form>
      
      {showFilters && (
        <div className="search-filters">
          <div className="filter-group">
            <label htmlFor="genre">Genre:</label>
            <select 
              id="genre" 
              name="genre" 
              value={filters.genre || ''}
              onChange={handleFilterChange}
              disabled={isLoading}
            >
              <option value="">All Genres</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
              <option value="Classic">Classic</option>
              <option value="Young Adult">Young Adult</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="yearFrom">Year From:</label>
            <input 
              type="number" 
              id="yearFrom" 
              name="yearFrom"
              min="1000"
              max={new Date().getFullYear()}
              value={filters.yearFrom || ''}
              onChange={handleFilterChange}
              disabled={isLoading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="yearTo">Year To:</label>
            <input 
              type="number" 
              id="yearTo" 
              name="yearTo"
              min="1000"
              max={new Date().getFullYear()}
              value={filters.yearTo || ''}
              onChange={handleFilterChange}
              disabled={isLoading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="minRating">Min Rating:</label>
            <select 
              id="minRating" 
              name="minRating" 
              value={filters.minRating || ''}
              onChange={handleFilterChange}
              disabled={isLoading}
            >
              <option value="">Any Rating</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
          
          <button 
            className="filter-reset-button"
            onClick={() => setFilters({})}
            disabled={isLoading}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
