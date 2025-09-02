import React, { useState, useEffect } from 'react';
import { Book } from '../../types';
import userService from '../../services/userService';
import BookCard from '../book/BookCard';

interface UserFavoritesProps {
  userId: string;
}

const UserFavorites: React.FC<UserFavoritesProps> = ({ userId }) => {
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await userService.getFavorites(userId);
      setFavorites(response.favorites);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch favorites');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const handleRemoveFromFavorites = async (bookId: string) => {
    try {
      await userService.removeFavorite(bookId);
      // Update the favorites list
      setFavorites(favorites.filter(book => book.id !== bookId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove from favorites');
    }
  };

  if (loading) return <div className="loading">Loading favorites...</div>;
  
  if (error) return <div className="error">{error}</div>;
  
  if (favorites.length === 0) {
    return (
      <div className="no-favorites">
        <p>You haven't added any books to your favorites yet.</p>
        <p>Browse books and click the heart icon to add them to your favorites.</p>
      </div>
    );
  }

  return (
    <div className="user-favorites">
      <h2>My Favorite Books</h2>
      
      <div className="favorites-grid">
        {favorites.map((book) => (
          <div key={book.id} className="favorite-book-wrapper">
            <BookCard 
              book={book} 
              isFavorite={true}
              onFavoriteToggle={(bookId, isFavorite) => {
                // When toggling off (unfavoriting), remove from the list
                if (!isFavorite) {
                  handleRemoveFromFavorites(bookId);
                }
              }}
              inFavoritesTab={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
