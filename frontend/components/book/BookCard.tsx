import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Book } from '../../services/bookService';
import StarRating from '../ui/StarRating';
import { useAuth } from '../../store/auth-context';
import userService from '../../services/userService';

// Default placeholder book cover
const PLACEHOLDER_COVER = 'https://via.placeholder.com/150x225?text=No+Cover';

// Props interface for BookCard
interface BookCardProps {
  book: Book;
  isFavorite?: boolean;
  onFavoriteToggle?: (bookId: string, isFavorite: boolean) => void;
  inFavoritesTab?: boolean;
}

/**
 * BookCard component displays a book in a card format
 * with image, title, author and rating
 */
const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  isFavorite = false, 
  onFavoriteToggle,
  inFavoritesTab = false 
}) => {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Update internal state when parent props change
  React.useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  // Limit description to a reasonable preview length
  const descriptionPreview = book.description.length > 100
    ? `${book.description.substring(0, 100)}...`
    : book.description;
  
  // Handle favorite toggle
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to book details
    e.stopPropagation(); // Prevent event bubbling
    
    if (!isAuthenticated || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // In favorites tab, we can only remove (not add)
      if (inFavoritesTab) {
        await userService.removeFavorite(book.id);
        // Update local state
        setFavorite(false);
        
        // Notify parent component
        if (onFavoriteToggle) {
          onFavoriteToggle(book.id, false);
        }
      } else {
        // Normal toggle behavior outside favorites tab
        const newFavoriteState = !favorite;
        
        if (favorite) {
          await userService.removeFavorite(book.id);
        } else {
          await userService.addFavorite(book.id);
        }
        
        // Update local state immediately for better user experience
        setFavorite(newFavoriteState);
        
        // Notify parent component if callback exists
        if (onFavoriteToggle) {
          onFavoriteToggle(book.id, newFavoriteState);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert to original state if there's an error
      setFavorite(favorite);
    } finally {
      setIsProcessing(false);
    }
  };
    
  return (
    <div className="book-card">
      <Link href={`/books/${book.id}`} legacyBehavior>
        <a className="book-card-link">
          <div className="book-card-image">
            <Image
              src={book.coverImage || PLACEHOLDER_COVER}
              alt={`Cover for ${book.title}`}
              width={150}
              height={225}
              style={{ objectFit: 'cover' }}
              unoptimized={book.coverImage?.startsWith('http')}
            />
            {isAuthenticated && (
              <button 
                className={`favorite-button ${favorite ? 'is-favorite' : ''} ${isProcessing ? 'processing' : ''} ${inFavoritesTab ? 'in-favorites-tab' : ''}`}
                onClick={handleFavoriteToggle}
                disabled={isProcessing}
                title={inFavoritesTab || favorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={inFavoritesTab || favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {inFavoritesTab && (
                  <span className="remove-label">Remove</span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
                  fill={favorite || inFavoritesTab ? "currentColor" : "none"} 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {isProcessing && (
                  <span className="processing-indicator"></span>
                )}
              </button>
            )}
          </div>
          
          <div className="book-card-content">
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">by {book.author}</p>
            
            <div className="book-rating">
              <StarRating 
                rating={book.averageRating} 
                readOnly={true} 
                size="small" 
                precision="half"
              />
              <span className="rating-value">{book.averageRating.toFixed(1)}</span>
              <span className="review-count">({book.reviewCount} {book.reviewCount === 1 ? 'review' : 'reviews'})</span>
            </div>
            
            <p className="book-description">{descriptionPreview}</p>
            
            <div className="book-genres">
              {book.genres.slice(0, 3).map(genre => (
                <span key={genre} className="genre-tag">{genre}</span>
              ))}
              {book.genres.length > 3 && (
                <span className="genre-more">+{book.genres.length - 3}</span>
              )}
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
};

export default BookCard;
