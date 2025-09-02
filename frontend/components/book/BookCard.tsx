import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Book } from '../../services/bookService';
import StarRating from '../ui/StarRating';

// Default placeholder book cover
const PLACEHOLDER_COVER = 'https://via.placeholder.com/150x225?text=No+Cover';

// Props interface for BookCard
interface BookCardProps {
  book: Book;
}

/**
 * BookCard component displays a book in a card format
 * with image, title, author and rating
 */
const BookCard: React.FC<BookCardProps> = ({ book }) => {
  // Limit description to a reasonable preview length
  const descriptionPreview = book.description.length > 100
    ? `${book.description.substring(0, 100)}...`
    : book.description;
    
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
