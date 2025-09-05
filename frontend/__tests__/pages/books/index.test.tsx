import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import BooksIndexPage from '../../../pages/books/index';
import bookService from '../../../services/bookService';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock bookService
jest.mock('../../../services/bookService', () => ({
  getBooks: jest.fn(),
  searchBooks: jest.fn(),
}));

// Define prop types for mock components
interface BookListProps {
  books: Array<any>;
  isLoading: boolean;
  error: string | null;
}

interface SearchBarProps {
  onSearch: (query: string, filters: any) => void;
  initialQuery?: string;
  isLoading: boolean;
  initialFilters?: any;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Mock components
jest.mock('../../../components/book/BookList', () => {
  return function MockBookList({ books, isLoading, error }: BookListProps) {
    return (
      <div data-testid="book-list">
        <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
        <div data-testid="error">{error || 'No Error'}</div>
        <div data-testid="book-count">{books.length}</div>
      </div>
    );
  };
});

jest.mock('../../../components/ui/SearchBar', () => {
  return function MockSearchBar({ onSearch, initialQuery, isLoading }: SearchBarProps) {
    return (
      <div data-testid="search-bar">
        <input 
          data-testid="search-input" 
          value={initialQuery || ''} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearch(e.target.value, {})}
        />
        <button 
          data-testid="search-button"
          onClick={() => onSearch('test search', { genres: ['fiction'] })}
          disabled={isLoading}
        >
          Search
        </button>
      </div>
    );
  };
});

jest.mock('../../../components/ui/Pagination', () => {
  return function MockPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    return (
      <div data-testid="pagination">
        <span data-testid="current-page">{currentPage}</span>
        <span data-testid="total-pages">{totalPages}</span>
        <button 
          data-testid="next-page" 
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
        <button 
          data-testid="prev-page" 
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
      </div>
    );
  };
});

describe('BooksIndexPage', () => {
  // Sample books data
  const mockBooks = [
    {
      id: '1',
      title: 'Test Book 1',
      author: 'Author 1',
      publishedYear: 2020,
      coverImage: '/test1.jpg',
      averageRating: 4.5,
      reviewCount: 10
    },
    {
      id: '2',
      title: 'Test Book 2',
      author: 'Author 2',
      publishedYear: 2021,
      coverImage: '/test2.jpg',
      averageRating: 4.0,
      reviewCount: 15
    }
  ];

  const mockPaginationData = {
    page: 1,
    limit: 10,
    totalPages: 3,
    totalBooks: 25
  };

  const mockSearchResponse = {
    books: mockBooks,
    count: 2
  };

  const mockBooksResponse = {
    books: mockBooks,
    ...mockPaginationData
  };

  // Mock router
  const mockRouter = {
    push: jest.fn(),
    query: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default mock implementations
    (bookService.getBooks as jest.Mock).mockResolvedValue(mockBooksResponse);
    (bookService.searchBooks as jest.Mock).mockResolvedValue(mockSearchResponse);

    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  test('renders the books page with initial books', async () => {
    render(<BooksIndexPage />);

    // Check initial heading
    expect(screen.getByText('Browse Books')).toBeInTheDocument();

    // Check loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Verify service call
    expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'title', 'asc');

    // Verify book list received the books
    expect(screen.getByTestId('book-count')).toHaveTextContent('2');
    
    // Check pagination
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('3');
  });

  test('handles search functionality', async () => {
    render(<BooksIndexPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));

    // Verify search was called
    await waitFor(() => {
      expect(bookService.searchBooks).toHaveBeenCalledWith('test search', { genres: ['fiction'] });
    });

    // Heading should change to indicate search
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    
    // Should show search results count
    expect(screen.getByText(/Found 2 books/)).toBeInTheDocument();
    expect(screen.getByText(/for "test search"/)).toBeInTheDocument();
  });

  test('handles empty search query', async () => {
    render(<BooksIndexPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Clear search input
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: '' } });

    // Verify getBooks was called with empty search
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalled();
    });

    // Should switch back to browse mode
    expect(screen.getByText('Browse Books')).toBeInTheDocument();
  });

  test('handles page change', async () => {
    render(<BooksIndexPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Click next page button
    fireEvent.click(screen.getByTestId('next-page'));

    // Verify service call with new page
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(2, 10, 'title', 'asc');
    });

    // Verify scrollTo was called
    expect(window.scrollTo).toHaveBeenCalled();
  });

  test('handles sorting change', async () => {
    render(<BooksIndexPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Find the sort dropdown and change value
    const sortSelect = screen.getByLabelText('Sort by:');
    
    // Test different sort options
    fireEvent.change(sortSelect, { target: { value: 'author' } });
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'author', 'asc');
    });

    fireEvent.change(sortSelect, { target: { value: 'newest' } });
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'publishedYear', 'desc');
    });

    fireEvent.change(sortSelect, { target: { value: 'oldest' } });
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'publishedYear', 'asc');
    });

    fireEvent.change(sortSelect, { target: { value: 'topRated' } });
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'averageRating', 'desc');
    });

    fireEvent.change(sortSelect, { target: { value: 'mostReviewed' } });
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'reviewCount', 'desc');
    });

    // Change back to title
    fireEvent.change(sortSelect, { target: { value: 'title' } });
    await waitFor(() => {
      expect(bookService.getBooks).toHaveBeenCalledWith(1, 10, 'title', 'asc');
    });
  });

  test('handles API error', async () => {
    // Mock API error
    (bookService.getBooks as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<BooksIndexPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load books. Please try again.');
    });
  });

  test('handles search in error state', async () => {
    // Mock API error for search
    (bookService.searchBooks as jest.Mock).mockRejectedValueOnce(new Error('Search Error'));

    render(<BooksIndexPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load books. Please try again.');
    });
  });

  test('sort control should be disabled during loading', async () => {
    render(<BooksIndexPage />);
    
    // Check if sort select is disabled during loading
    expect(screen.getByLabelText('Sort by:')).toBeDisabled();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Sort should be enabled after loading
    expect(screen.getByLabelText('Sort by:')).not.toBeDisabled();
  });

  test('sort control should not be visible in search mode', async () => {
    render(<BooksIndexPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Sort should be visible initially
    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();

    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));

    // Wait for search to complete
    await waitFor(() => {
      expect(bookService.searchBooks).toHaveBeenCalled();
    });

    // Sort should not be visible in search mode
    expect(screen.queryByLabelText('Sort by:')).not.toBeInTheDocument();
  });
});
