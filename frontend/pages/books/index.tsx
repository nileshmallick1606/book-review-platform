import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BookList from '../../components/book/BookList';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import bookService, { Book, BookSearchFilters } from '../../services/bookService';

// Interface for API response pagination data
interface PaginationData {
  page: number;
  limit: number;
  totalPages: number;
  totalBooks: number;
}

/**
 * Books Index Page - Displays a paginated list of books with search functionality
 */
const BooksIndexPage: React.FC = () => {
  // State for books data
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalBooks: 0
  });
  
  // State for sorting
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  
  // State for search and loading
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<BookSearchFilters>({});
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Load books on initial render and when page, sort, or other params change
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (searchQuery) {
          // Search mode - fetch filtered books
          const response = await bookService.searchBooks(searchQuery, searchFilters);
          setBooks(response.books);
          setPagination({
            ...pagination,
            totalBooks: response.count,
            totalPages: Math.ceil(response.count / pagination.limit) || 1
          });
          setIsSearching(true);
        } else {
          // Regular browse mode - fetch paginated books
          const response = await bookService.getBooks(
            pagination.page, 
            pagination.limit, 
            sortBy, 
            sortOrder
          );
          setBooks(response.books);
          setPagination({
            page: response.page,
            limit: response.limit,
            totalPages: response.totalPages,
            totalBooks: response.totalBooks
          });
          setIsSearching(false);
        }
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, [
    pagination.page, 
    pagination.limit, 
    sortBy, 
    sortOrder, 
    searchQuery, 
    searchFilters
  ]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination({
      ...pagination,
      page: newPage
    });
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle search
  const handleSearch = (query: string, filters: BookSearchFilters) => {
    // If the query is empty, reset everything and reload the page
    if (!query || query.trim() === '') {
      // Reset search state
      setSearchQuery('');
      setSearchFilters({});
      setIsSearching(false);
      
      // Reset pagination to first page
      setPagination({
        ...pagination,
        page: 1
      });
      
      // Force a reload of books without search filters
      return;
    }
    
    // Otherwise proceed with search
    setSearchQuery(query);
    setSearchFilters(filters);
    
    // Reset to first page when searching
    setPagination({
      ...pagination,
      page: 1
    });
  };
  
  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'title' || value === 'author') {
      setSortBy(value);
      setSortOrder('asc');
    } else if (value === 'newest') {
      setSortBy('publishedYear');
      setSortOrder('desc');
    } else if (value === 'oldest') {
      setSortBy('publishedYear');
      setSortOrder('asc');
    } else if (value === 'topRated') {
      setSortBy('averageRating');
      setSortOrder('desc');
    } else if (value === 'mostReviewed') {
      setSortBy('reviewCount');
      setSortOrder('desc');
    }
  };
  
  return (
    <>
      <Head>
        <title>{searchQuery ? `Search: ${searchQuery}` : 'Browse Books'} - BookReview</title>
        <meta name="description" content="Browse and search for books on BookReview Platform" />
      </Head>
      
      <div className="books-page">

      <div className="books-page-header">
        <h1 className="page-title">{searchQuery ? 'Search Results' : 'Browse Books'}</h1>
        
        <div className="books-search-container">
          <SearchBar
            onSearch={handleSearch}
            initialQuery={searchQuery}
            initialFilters={searchFilters}
            isLoading={loading}
          />
        </div>
        
        <div className="books-controls">
          {!isSearching && (
            <div className="sort-container">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select"
                value={
                  sortBy === 'publishedYear' 
                    ? sortOrder === 'desc' ? 'newest' : 'oldest'
                    : sortBy === 'averageRating'
                      ? 'topRated'
                      : sortBy === 'reviewCount'
                        ? 'mostReviewed'
                        : sortBy
                }
                onChange={handleSortChange}
                disabled={loading}
              >
                <option value="title">Title (A-Z)</option>
                <option value="author">Author (A-Z)</option>
                <option value="newest">Publication Date (Newest)</option>
                <option value="oldest">Publication Date (Oldest)</option>
                <option value="topRated">Top Rated</option>
                <option value="mostReviewed">Most Reviewed</option>
              </select>
            </div>
          )}
          
          {searchQuery && searchQuery.trim() !== '' && (
            <div className="results-info">
              Found {pagination.totalBooks} 
              {pagination.totalBooks === 1 ? ' book' : ' books'} 
              for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
      
      <div className="books-page-content">
        <BookList 
          books={books} 
          isLoading={loading} 
          error={error} 
        />
        
        {!loading && !error && books.length > 0 && (
          <div className="pagination-container">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default BooksIndexPage;
