import React, { useState, useEffect, useCallback } from 'react';
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
 * Includes debouncing for efficient API calls
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
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      
      return (searchQuery: string, searchFilters: BookSearchFilters) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (searchQuery.trim()) {
            onSearch(searchQuery, searchFilters);
          }
        }, 500); // 500ms delay
      };
    })(),
    [onSearch]
  );
  
  // Trigger search when query or filters change
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query, filters);
    }
  }, [query, filters, debouncedSearch]);
  
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
  
  // Clear search
  const handleClear = () => {
    setQuery('');
    setFilters({});
    onSearch('', {});
  };
  
  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search books by title or author..."
          value={query}
          onChange={handleQueryChange}
          disabled={isLoading}
        />
        
        {query && (
          <button 
            className="search-clear-button"
            onClick={handleClear}
            disabled={isLoading}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
        
        <button 
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
