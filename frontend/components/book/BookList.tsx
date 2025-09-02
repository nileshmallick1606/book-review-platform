import React, { useState, useEffect, useCallback } from 'react';
import { Book } from '../../services/bookService';
import userService from '../../services/userService';
import { useAuth } from '../../store/auth-context';
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
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [refreshFavorites, setRefreshFavorites] = useState(0);

  // Create a memoized fetch favorites function
  const fetchFavorites = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setFavoritesLoaded(false);
        const response = await userService.getFavorites(user.id);
        // Extract book IDs from favorites
        const favoriteIds = response.favorites.map((book: Book) => book.id);
        setFavorites(favoriteIds);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        setFavoritesLoaded(true);
      }
    } else {
      setFavoritesLoaded(true);
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  // Fetch user favorites if authenticated
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites, refreshFavorites]);

  // Handle favorite toggle
  const handleFavoriteToggle = (bookId: string, isFavorite: boolean) => {
    if (isFavorite) {
      // Add to favorites locally first for immediate feedback
      setFavorites(prev => [...prev, bookId]);
    } else {
      // Remove from favorites locally first for immediate feedback
      setFavorites(prev => prev.filter(id => id !== bookId));
    }
    
    // Trigger a refresh of favorites from the server after a short delay
    // This ensures our UI is in sync with the backend state
    setTimeout(() => {
      setRefreshFavorites(prev => prev + 1);
    }, 300);
  };

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
        <BookCard 
          key={book.id} 
          book={book} 
          isFavorite={favorites.includes(book.id)}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}
    </div>
  );
};

export default BookList;
