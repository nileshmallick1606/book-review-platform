import React from 'react';
import { Book } from '../../services/bookService';
import BookCard from './BookCard';

// Props interface for BookList
interface BookListProps {
  books: Book[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * BookList component displays a grid of book cards
 * with loading and error states
 */
const BookList: React.FC<BookListProps> = ({ 
  books, 
  isLoading = false, 
  error = null 
}) => {
  // Render loading state
  if (isLoading) {
    return (
      <div className="book-list-loading">
        <div className="spinner"></div>
        <p>Loading books...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="book-list-error">
        <p>Error loading books: {error}</p>
        <button className="retry-button">Retry</button>
      </div>
    );
  }
  
  // Render empty state
  if (books.length === 0) {
    return (
      <div className="book-list-empty">
        <p>No books found.</p>
      </div>
    );
  }
  
  // Render book grid
  return (
    <div className="book-list">
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};

export default BookList;
